from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from catalog.models import Category, Product, ProductVariant

from io import BytesIO

from django.core.files.base import ContentFile
from PIL import Image, ImageDraw, ImageFont

from catalog.models import Category, Product, ProductImage, ProductVariant
from django.contrib.auth import get_user_model
from sellers.models import SellerProfile

CATEGORIES = ["Khimar", "Abaya", "Hijab", "Kids Wear"]

# (name, categories, regular_price, sale_price, description, [(size, color, stock), ...])
PRODUCTS = [
    ("Classic Jersey Khimar", ["Khimar"], "1450.00", "1190.00",
     "Soft stretch jersey khimar with a relaxed drape.",
     [("Free", "Black", 25), ("Free", "Navy", 12), ("Free", "Maroon", 0)]),
    ("Chiffon Layered Khimar", ["Khimar"], "1850.00", None,
     "Lightweight two-layer chiffon, ideal for daily wear.",
     [("Free", "Beige", 10), ("Free", "Olive", 8)]),
    ("Everyday Open Abaya", ["Abaya"], "3200.00", "2699.00",
     "Breathable open-front abaya with side pockets.",
     [("M", "Black", 6), ("L", "Black", 9), ("XL", "Black", 4), ("L", "Charcoal", 5)]),
    ("Embroidered Festive Abaya", ["Abaya"], "5400.00", None,
     "Hand-finished embroidery along the sleeves and hem.",
     [("M", "Black", 3), ("L", "Black", 2)]),
    ("Butterfly Abaya", ["Abaya"], "3900.00", "3350.00",
     "Flowing butterfly cut with wide sleeves.",
     [("S", "Navy", 4), ("M", "Navy", 6), ("L", "Navy", 0)]),
    ("Premium Cotton Hijab", ["Hijab"], "590.00", None,
     "Breathable cotton hijab that holds its shape.",
     [("Free", "White", 40), ("Free", "Dusty Rose", 22), ("Free", "Sage", 15)]),
    ("Satin Silk Scarf", ["Hijab"], "850.00", "690.00",
     "Smooth satin finish with a subtle sheen.",
     [(None, "Champagne", 18)]),
    ("Instant Pull-On Hijab", ["Hijab"], "490.00", None,
     "No pins needed. A one-size pull-on style.",
     [("Free", "Black", 30)]),
    ("Girls Abaya Set", ["Kids Wear", "Abaya"], "2250.00", "1890.00",
     "Abaya and matching scarf for ages 6 to 12.",
     [("6-8Y", "Pink", 7), ("8-10Y", "Pink", 5), ("10-12Y", "Pink", 2)]),
    ("Kids Everyday Khimar", ["Kids Wear", "Khimar"], "990.00", None,
     "Comfortable jersey khimar sized for children.",
     [("Free", "Grey", 14)]),
]


PALETTE = ["#E8590C", "#2F9E44", "#1C7ED6", "#7048E8", "#C2255C", "#495057"]


def make_placeholder(label, color, size=(800, 800)):
    """Return a JPEG placeholder as an in-memory file (nothing written to disk)."""
    img = Image.new("RGB", size, color)
    draw = ImageDraw.Draw(img)
    draw.multiline_text((50, 50), label, fill="white", font=ImageFont.load_default(size=44))
    buffer = BytesIO()
    img.save(buffer, "JPEG", quality=85)
    return ContentFile(buffer.getvalue())

class Command(BaseCommand):
    help = "Create demo categories, products, variants and placeholder images. Safe to re-run."

    @transaction.atomic
    def handle(self, *args, **options):
        categories = {}
        for name in CATEGORIES:
            categories[name], _ = Category.objects.get_or_create(name=name)

        owner = get_user_model().objects.filter(is_superuser=True).first()
        if owner is None:
            raise CommandError("Create a superuser first (python manage.py createsuperuser).")
        shop, _ = SellerProfile.objects.get_or_create(
            user=owner,
            defaults={"shop_name": "KenaBazaar Official", "status": SellerProfile.Status.APPROVED},
        )

        created_products = 0
        for index, (name, cats, regular, sale, description, variants) in enumerate(PRODUCTS, start=1):
            product, created = Product.objects.update_or_create(
                name=name,
                defaults={
                    "description": description,
                    "regular_price": Decimal(regular),
                    "sale_price": Decimal(sale) if sale else None,
                    "is_active": True,
                    "seller": shop,
                },
            )
            product.categories.set([categories[c] for c in cats])
            created_products += int(created)

            for size, color, stock in variants:
                sku = f"KB{index:03d}-{size or 'NA'}-{color or 'NA'}".upper().replace(" ", "")[:50]
                ProductVariant.objects.update_or_create(
                    sku=sku,
                    defaults={"product": product, "size": size, "color": color, "stock": stock},
                )

            # NEW: placeholder images (skipped if the product already has some)
            if not product.images.exists():
                for n in range(1, 4):
                    color = PALETTE[(index + n) % len(PALETTE)]
                    image = ProductImage(
                        product=product,
                        alt_text=f"{name} - view {n}",
                        is_primary=(n == 1),
                    )
                    image.image.save(
                        f"demo-{product.slug}-{n}.jpg",
                        make_placeholder(f"{name}\nView {n}", color),
                    )

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(CATEGORIES)} categories, {len(PRODUCTS)} products "
            f"({created_products} new)."
        ))