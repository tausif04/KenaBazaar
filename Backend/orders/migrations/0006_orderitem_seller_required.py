import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0005_backfill_straggler_order_items"),
        ("catalog", "0006_product_seller_required"),
        ("sellers", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="orderitem",
            name="seller",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="order_items",
                to="sellers.sellerprofile",
            ),
        ),
    ]
