from django.db import migrations


def assign_default_seller(apps, schema_editor):
    """Give every existing product to one 'KenaBazaar Official' shop.

    Historical models (apps.get_model) have no custom save(), so the slug
    is set by hand here.
    """
    Product = apps.get_model("catalog", "Product")
    if not Product.objects.filter(seller__isnull=True).exists():
        return  # empty DB or already backfilled: nothing to do

    User = apps.get_model("accounts", "User")
    SellerProfile = apps.get_model("sellers", "SellerProfile")

    owner = User.objects.filter(is_superuser=True).order_by("pk").first()
    if owner is None:
        raise RuntimeError(
            "Products exist but there is no superuser to own the default shop. "
            "Create one (createsuperuser) and re-run migrate."
        )

    shop, _ = SellerProfile.objects.get_or_create(
        user=owner,
        defaults={
            "shop_name": "KenaBazaar Official",
            "slug": "kenabazaar-official",
            "status": "approved",
        },
    )
    Product.objects.filter(seller__isnull=True).update(seller=shop)


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0003_product_seller"),
        ("accounts", "0001_initial"),
        ("sellers", "0001_initial"),
    ]

    operations = [
        # No reverse: un-assigning sellers would be data loss, not an undo.
        migrations.RunPython(assign_default_seller, migrations.RunPython.noop),
    ]
