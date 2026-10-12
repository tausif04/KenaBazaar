from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from catalog.models import Category, Product, ProductVariant

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


class Command(BaseCommand):
    help = "Create demo categories, products and variants (no images). Safe to re-run."

    @transaction.atomic
    def handle(self, *args, **options):
        categories = {}
        for name in CATEGORIES:
            categories[name], _ = Category.objects.get_or_create(name=name)

        created_products = 0
        for index, (name, cats, regular, sale, description, variants) in enumerate(PRODUCTS, start=1):
            product, created = Product.objects.update_or_create(
                name=name,
                defaults={
                    "description": description,
                    "regular_price": Decimal(regular),
                    "sale_price": Decimal(sale) if sale else None,
                    "is_active": True,
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

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(CATEGORIES)} categories, {len(PRODUCTS)} products "
            f"({created_products} new)."
        ))
