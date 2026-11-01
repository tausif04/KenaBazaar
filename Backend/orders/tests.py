from django.contrib.auth import get_user_model
from django.test import TestCase

from cart.models import Cart, CartItem
from catalog.models import Product, ProductVariant
from sellers.models import SellerProfile

from .services import create_order_from_cart

User = get_user_model()


class OrderItemSellerSnapshotTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(email="c@kb.com", password="pass1234!")
        self.shops = []
        cart = Cart.objects.create(user=self.customer)
        for i in range(2):
            owner = User.objects.create_user(email=f"s{i}@kb.com", password="pass1234!")
            shop = SellerProfile.objects.create(user=owner, shop_name=f"Shop {i}")
            product = Product.objects.create(name=f"P{i}", regular_price=100, seller=shop)
            variant = ProductVariant.objects.create(product=product, sku=f"SKU{i}", stock=5)
            CartItem.objects.create(cart=cart, variant=variant, quantity=1)
            self.shops.append(shop)

    def test_each_item_snapshots_its_own_seller(self):
        order = create_order_from_cart(
            self.customer,
            {"shipping_name": "A", "shipping_phone": "1", "shipping_address": "Dhaka"},
        )
        sellers = {i.sku: i.seller_id for i in order.items.all()}
        self.assertEqual(sellers, {"SKU0": self.shops[0].id, "SKU1": self.shops[1].id})

    def test_snapshot_survives_product_reassignment(self):
        order = create_order_from_cart(
            self.customer,
            {"shipping_name": "A", "shipping_phone": "1", "shipping_address": "Dhaka"},
        )
        Product.objects.filter(name="P0").update(seller=self.shops[1])
        item = order.items.get(sku="SKU0")
        self.assertEqual(item.seller_id, self.shops[0].id)   # history did not move
