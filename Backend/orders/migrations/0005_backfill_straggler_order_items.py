from django.db import migrations
from django.db.models import OuterRef, Subquery


def fill_missing_sellers(apps, schema_editor):
    """Any order item still without a seller gets its product's current seller."""
    OrderItem = apps.get_model("orders", "OrderItem")
    ProductVariant = apps.get_model("catalog", "ProductVariant")
    OrderItem.objects.filter(seller__isnull=True).update(
        seller=Subquery(
            ProductVariant.objects.filter(pk=OuterRef("variant_id"))
            .values("product__seller_id")[:1]
        )
    )


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0004_backfill_orderitem_snapshots"),
        ("catalog", "0005_backfill_straggler_products"),  # products must have sellers first
    ]

    operations = [
        migrations.RunPython(fill_missing_sellers, migrations.RunPython.noop),
    ]
