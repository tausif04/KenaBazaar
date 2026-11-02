"""Read-side queries shared by several seller views.

Every function takes the SellerProfile explicitly, so "which seller?" is
never an implicit global and each query is scoped in exactly one place.
"""
from django.db.models import Exists, OuterRef, Prefetch

from catalog.models import Product, ProductVariant
from orders.models import Order, OrderItem

LOW_STOCK_THRESHOLD = 5


def seller_products(seller):
    return (
        Product.objects.filter(seller=seller)
        .prefetch_related("categories", "variants", "images")
    )


def seller_variants(seller):
    return ProductVariant.objects.filter(product__seller=seller).select_related("product")


def seller_paid_items(seller):
    return OrderItem.objects.filter(seller=seller, order__status=Order.Status.PAID)


def seller_orders(seller):
    """Paid orders that contain at least one item from this seller.

    Each order carries ONLY this seller's items (`seller_items`). Other sellers'
    lines, the order total and the buyer account are never loaded or exposed.
    """
    mine = OrderItem.objects.filter(order=OuterRef("pk"), seller=seller)
    return (
        Order.objects.filter(status=Order.Status.PAID)
        .filter(Exists(mine))
        .prefetch_related(
            Prefetch("items", queryset=OrderItem.objects.filter(seller=seller), to_attr="seller_items")
        )
        .order_by("-paid_at", "-id")
    )
