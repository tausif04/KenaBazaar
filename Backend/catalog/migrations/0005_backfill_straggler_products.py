import importlib

from django.db import migrations

_step1 = importlib.import_module("catalog.migrations.0004_backfill_product_seller")


class Migration(migrations.Migration):
    """Safety net before NOT NULL: give any product created since 0004 a seller.

    Kept separate from the ALTER in 0006 because PostgreSQL refuses to ALTER a
    table that has pending trigger events from updates in the same transaction.
    """

    dependencies = [
        ("catalog", "0004_backfill_product_seller"),
    ]

    operations = [
        migrations.RunPython(_step1.assign_default_seller, migrations.RunPython.noop),
    ]
