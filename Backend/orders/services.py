from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from cart.models import Cart
from catalog.models import ProductVariant
from .models import Order, OrderItem


@transaction.atomic
def create_order_from_cart(user, shipping):
    cart = Cart.objects.filter(user=user).first()
    items = list(cart.items.select_related("variant__product")) if cart else []
    if not items:
        raise ValidationError({"detail": "Your cart is empty."})

    for item in items:
        if item.quantity > item.variant.stock:
            raise ValidationError(
                {"detail": f"Only {item.variant.stock} of {item.variant.sku} in stock."}
            )

    order = Order.objects.create(user=user, total=0, **shipping)
    total = 0
    rows = []
    for item in items:
        price = item.variant.product.current_price   # frozen here, never re-read later
        total += price * item.quantity
        rows.append(OrderItem(
            order=order, variant=item.variant,
            seller_id=item.variant.product.seller_id,   # snapshot
            product_name=item.variant.product.name, sku=item.variant.sku,
            price_at_purchase=price, quantity=item.quantity,
        ))
    OrderItem.objects.bulk_create(rows)
    order.total = total
    order.save(update_fields=["total"])
    return order


@transaction.atomic
def mark_order_paid(order_id):
    # row lock: two simultaneous webhook deliveries can't both pass the status check
    order = Order.objects.select_for_update().get(pk=order_id)
    if order.status == Order.Status.PAID:
        return order                                   # idempotent: replay is a no-op

    for item in order.items.all():
        ProductVariant.objects.filter(
            pk=item.variant_id, stock__gte=item.quantity,
        ).update(stock=F("stock") - item.quantity)     # atomic in SQL, no read-modify-write race

    order.status = Order.Status.PAID
    order.paid_at = timezone.now()
    order.save(update_fields=["status", "paid_at"])
    Cart.objects.filter(user=order.user).delete()      # cart clears on payment, not on checkout
    return order

ALLOWED = {"processing": {"shipped"}, "shipped": {"delivered"}, "delivered": set()}
STAGE = {"processing": 0, "shipped": 1, "delivered": 2}


def _sync_order_delivery(order):
    """Order-level status is derived from its items: it is only as far along as
    the slowest parcel. One seller shipping early must not mark the whole order shipped."""
    statuses = list(order.items.values_list("fulfillment_status", flat=True))
    lowest = min(statuses, key=STAGE.__getitem__) if statuses else "processing"
    if lowest == order.delivery_status:
        return order
    now = timezone.now()
    order.delivery_status = lowest
    if lowest in ("shipped", "delivered") and not order.shipped_at:
        order.shipped_at = now
    if lowest == "delivered":
        order.delivered_at = now
    order.save(update_fields=["delivery_status", "shipped_at", "delivered_at"])
    return order


def _advance_item(item, new_status, now, courier="", tracking_number=""):
    item.fulfillment_status = new_status
    if courier:
        item.courier = courier
    if tracking_number:
        item.tracking_number = tracking_number
    if new_status == "shipped":
        item.shipped_at = now
    elif new_status == "delivered":
        item.shipped_at = item.shipped_at or now
        item.delivered_at = now
    item.save(update_fields=[
        "fulfillment_status", "courier", "tracking_number", "shipped_at", "delivered_at",
    ])


@transaction.atomic
def set_delivery_status(order_id, new_status):
    """Admin path: moves every item of the order, then re-derives the order status."""
    # Row lock: a second caller waits here, then re-reads the fresh state.
    order = Order.objects.select_for_update().get(pk=order_id)

    if order.status != Order.Status.PAID:
        raise ValueError("Only paid orders can be shipped.")
    if new_status not in ALLOWED[order.delivery_status]:
        raise ValueError(f"Cannot go from {order.delivery_status} to {new_status}.")

    now = timezone.now()
    for item in order.items.select_for_update():
        if STAGE[item.fulfillment_status] < STAGE[new_status]:   # never move an item backwards
            _advance_item(item, new_status, now, order.courier, order.tracking_number)
    return _sync_order_delivery(order)


@transaction.atomic
def set_seller_fulfillment(order_id, seller, new_status, courier="", tracking_number=""):
    """Seller path: moves only THIS seller's items (one parcel per seller per order)."""
    # Same lock order as set_delivery_status (order row first), so an admin action
    # and a seller action on the same order cannot deadlock each other.
    order = Order.objects.select_for_update().get(pk=order_id)
    if order.status != Order.Status.PAID:
        raise ValueError("Only paid orders can be fulfilled.")

    items = list(order.items.select_for_update().filter(seller=seller))
    if not items:
        raise ValueError("This order has no items from your shop.")

    eligible = [i for i in items if new_status in ALLOWED[i.fulfillment_status]]
    if not eligible:
        raise ValueError(f"These items cannot be moved to {new_status}.")

    now = timezone.now()
    for item in eligible:
        _advance_item(item, new_status, now, courier, tracking_number)
    return _sync_order_delivery(order)
