from django.db import migrations
from django.db.models import OuterRef, Subquery


def backfill(apps, schema_editor):
    """Snapshot seller + fulfillment data onto existing order items.

    - seller        <- the item's variant's product's seller (as of today)
    - fulfillment   <- the parent order's delivery fields, since until now
                       shipping was tracked per order
    """
    OrderItem = apps.get_model("orders", "OrderItem")
    Order = apps.get_model("orders", "Order")
    ProductVariant = apps.get_model("catalog", "ProductVariant")

    OrderItem.objects.filter(seller__isnull=True).update(
        seller=Subquery(
            ProductVariant.objects.filter(pk=OuterRef("variant_id"))
            .values("product__seller_id")[:1]
        )
    )

    for order in Order.objects.iterator():
        order.items.update(
            fulfillment_status=order.delivery_status,
            courier=order.courier,
            tracking_number=order.tracking_number,
            shipped_at=order.shipped_at,
            delivered_at=order.delivered_at,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0003_orderitem_seller_fulfillment"),
        ("catalog", "0004_backfill_product_seller"),  # products must have sellers first
    ]

    operations = [
        migrations.RunPython(backfill, migrations.RunPython.noop),
    ]
