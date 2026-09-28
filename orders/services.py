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