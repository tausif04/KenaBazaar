import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0005_backfill_straggler_products"),
        ("sellers", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="product",
            name="seller",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="products",
                to="sellers.sellerprofile",
            ),
        ),
    ]
