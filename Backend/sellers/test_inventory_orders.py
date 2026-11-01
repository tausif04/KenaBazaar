from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase

from catalog.models import Product, ProductVariant
from orders.models import Order, OrderItem
from orders.services import set_delivery_status

from .testing import auth, make_seller, make_user


def make_order(buyer, lines, status="paid"):
    """lines: [(variant, qty, price)] — each line's seller is the variant's product's seller."""
    order = Order.objects.create(
        user=buyer, status=status, total=sum(q * p for _, q, p in lines),
        shipping_name="Buyer Name", shipping_phone="017", shipping_address="Dhaka",
        paid_at=timezone.now() if status == "paid" else None,
    )
    for variant, qty, price in lines:
        OrderItem.objects.create(
            order=order, variant=variant, seller=variant.product.seller,
            product_name=variant.product.name, sku=variant.sku,
            price_at_purchase=price, quantity=qty,
        )
    return order


class MarketplaceFixture:
    def build(self):
        self.user_a, self.shop_a = make_seller("a@kb.com", "Shop A")
        self.user_b, self.shop_b = make_seller("b@kb.com", "Shop B")
        self.buyer = make_user("buyer@kb.com")
        pa = Product.objects.create(name="A-product", regular_price=100, seller=self.shop_a)
        pb = Product.objects.create(name="B-product", regular_price=50, seller=self.shop_b)
        self.va = ProductVariant.objects.create(product=pa, sku="A-1", stock=3)
        self.vb = ProductVariant.objects.create(product=pb, sku="B-1", stock=20)


class InventoryTests(MarketplaceFixture, APITestCase):
    def setUp(self):
        self.build()
        self.low = ProductVariant.objects.create(product=self.va.product, sku="A-LOW", stock=1)
        self.zero = ProductVariant.objects.create(product=self.va.product, sku="A-ZERO", stock=0, size="L")
        self.big = ProductVariant.objects.create(product=self.va.product, sku="A-BIG", stock=50, size="XL")
        auth(self.client, self.user_a)

    def skus(self, query=""):
        return [v["sku"] for v in self.client.get(f"/api/seller/inventory/{query}").data["results"]]

    def test_lists_only_own_variants_lowest_stock_first(self):
        self.assertEqual(self.skus(), ["A-ZERO", "A-LOW", "A-1", "A-BIG"])

    def test_low_stock_and_out_of_stock_filters(self):
        self.assertEqual(self.skus("?low_stock=true"), ["A-LOW", "A-1"])
        self.assertEqual(self.skus("?out_of_stock=true"), ["A-ZERO"])

    def test_search_by_sku(self):
        self.assertEqual(self.skus("?search=BIG"), ["A-BIG"])

    def test_quick_stock_update(self):
        r = self.client.patch(f"/api/seller/inventory/{self.va.id}/", {"stock": 40})
        self.assertEqual(r.status_code, 200)
        self.va.refresh_from_db()
        self.assertEqual(self.va.stock, 40)

    def test_only_stock_is_writable(self):
        self.client.patch(f"/api/seller/inventory/{self.va.id}/", {"stock": 7, "sku": "HACK", "size": "Z"})
        self.va.refresh_from_db()
        self.assertEqual((self.va.stock, self.va.sku, self.va.size), (7, "A-1", None))

    def test_negative_stock_rejected(self):
        self.assertEqual(self.client.patch(f"/api/seller/inventory/{self.va.id}/", {"stock": -1}).status_code, 400)

    def test_other_sellers_variant_is_404(self):
        r = self.client.patch(f"/api/seller/inventory/{self.vb.id}/", {"stock": 0})
        self.assertEqual(r.status_code, 404)
        self.vb.refresh_from_db()
        self.assertEqual(self.vb.stock, 20)

    def test_put_and_delete_are_not_offered(self):
        self.assertEqual(self.client.put(f"/api/seller/inventory/{self.va.id}/", {"stock": 1}).status_code, 405)
        self.assertEqual(self.client.delete(f"/api/seller/inventory/{self.va.id}/").status_code, 405)


class SellerOrderViewTests(MarketplaceFixture, APITestCase):
    def setUp(self):
        self.build()
        self.order = make_order(self.buyer, [(self.va, 2, 100), (self.vb, 1, 50)])
        self.unpaid = make_order(self.buyer, [(self.va, 1, 100)], status="pending")
        auth(self.client, self.user_a)

    def test_list_shows_only_paid_orders_with_only_my_items(self):
        r = self.client.get("/api/seller/orders/")
        self.assertEqual(r.data["count"], 1)
        order = r.data["results"][0]
        self.assertEqual([i["sku"] for i in order["items"]], ["A-1"])
        self.assertEqual(order["subtotal"], "200.00")
        self.assertEqual(order["shipping_name"], "Buyer Name")

    def test_response_does_not_leak_totals_buyer_or_other_sellers(self):
        order = self.client.get("/api/seller/orders/").data["results"][0]
        for forbidden in ("total", "user", "stripe_session_id", "status"):
            self.assertNotIn(forbidden, order)
        self.assertNotIn("B-1", str(order))
        self.assertNotIn("buyer@kb.com", str(order))

    def test_order_without_my_items_is_404(self):
        only_b = make_order(self.buyer, [(self.vb, 1, 50)])
        self.assertEqual(self.client.get(f"/api/seller/orders/{only_b.id}/").status_code, 404)

    def test_unpaid_order_is_404(self):
        self.assertEqual(self.client.get(f"/api/seller/orders/{self.unpaid.id}/").status_code, 404)

    def test_status_filter(self):
        self.assertEqual(self.client.get("/api/seller/orders/?fulfillment_status=processing").data["count"], 1)
        self.assertEqual(self.client.get("/api/seller/orders/?fulfillment_status=shipped").data["count"], 0)

    def test_list_query_count_does_not_grow_with_orders(self):
        from django.db import connection
        from django.test.utils import CaptureQueriesContext
        for _ in range(6):
            make_order(self.buyer, [(self.va, 1, 100), (self.vb, 1, 50)])
        with CaptureQueriesContext(connection) as ctx:
            self.assertEqual(self.client.get("/api/seller/orders/").status_code, 200)
        self.assertLessEqual(len(ctx), 8, [q["sql"] for q in ctx])


class FulfillmentTests(MarketplaceFixture, APITestCase):
    def setUp(self):
        self.build()
        self.order = make_order(self.buyer, [(self.va, 2, 100), (self.vb, 1, 50)])
        self.url = f"/api/seller/orders/{self.order.id}/fulfillment/"
        auth(self.client, self.user_a)

    def ship(self, **extra):
        return self.client.post(self.url, {"status": "shipped", "courier": "Pathao", "tracking_number": "T1", **extra})

    def test_shipping_requires_a_courier(self):
        r = self.client.post(self.url, {"status": "shipped"})
        self.assertEqual(r.status_code, 400)

    def test_ship_sets_item_fields_and_timestamp(self):
        r = self.ship()
        self.assertEqual(r.status_code, 200, r.data)
        item = self.order.items.get(seller=self.shop_a)
        self.assertEqual((item.fulfillment_status, item.courier, item.tracking_number), ("shipped", "Pathao", "T1"))
        self.assertIsNotNone(item.shipped_at)

    def test_one_sellers_shipment_does_not_touch_the_other_sellers_items(self):
        self.ship()
        self.assertEqual(self.order.items.get(seller=self.shop_b).fulfillment_status, "processing")

    def test_order_status_waits_for_the_slowest_seller(self):
        self.ship()
        self.order.refresh_from_db()
        self.assertEqual(self.order.delivery_status, "processing")      # B has not shipped yet
        auth(self.client, self.user_b)
        self.client.post(self.url, {"status": "shipped", "courier": "RedX"})
        self.order.refresh_from_db()
        self.assertEqual(self.order.delivery_status, "shipped")
        self.assertIsNotNone(self.order.shipped_at)

    def test_order_becomes_delivered_only_when_every_seller_delivered(self):
        self.ship(); 
        self.client.post(self.url, {"status": "delivered"})
        auth(self.client, self.user_b)
        self.client.post(self.url, {"status": "shipped", "courier": "RedX"})
        self.order.refresh_from_db()
        self.assertEqual(self.order.delivery_status, "shipped")
        self.client.post(self.url, {"status": "delivered"})
        self.order.refresh_from_db()
        self.assertEqual(self.order.delivery_status, "delivered")
        self.assertIsNotNone(self.order.delivered_at)

    def test_cannot_skip_a_stage(self):
        self.assertEqual(self.client.post(self.url, {"status": "delivered"}).status_code, 409)

    def test_cannot_ship_twice(self):
        self.ship()
        self.assertEqual(self.ship().status_code, 409)

    def test_cannot_fulfil_an_order_you_have_no_items_in(self):
        only_b = make_order(self.buyer, [(self.vb, 1, 50)])
        r = self.client.post(f"/api/seller/orders/{only_b.id}/fulfillment/", {"status": "shipped", "courier": "X"})
        self.assertEqual(r.status_code, 404)
        self.assertEqual(only_b.items.get().fulfillment_status, "processing")

    def test_cannot_fulfil_an_unpaid_order(self):
        pending = make_order(self.buyer, [(self.va, 1, 100)], status="pending")
        r = self.client.post(f"/api/seller/orders/{pending.id}/fulfillment/", {"status": "shipped", "courier": "X"})
        self.assertEqual(r.status_code, 404)

    def test_response_contains_only_my_items(self):
        r = self.ship()
        self.assertEqual([i["sku"] for i in r.data["items"]], ["A-1"])
        self.assertEqual(r.data["fulfillment_status"], "shipped")


class AdminDeliveryReconcileTests(MarketplaceFixture, TestCase):
    def setUp(self):
        self.build()
        self.order = make_order(self.buyer, [(self.va, 1, 100), (self.vb, 1, 50)])

    def test_admin_ship_moves_every_item(self):
        set_delivery_status(self.order.id, "shipped")
        self.assertEqual(set(self.order.items.values_list("fulfillment_status", flat=True)), {"shipped"})
        self.order.refresh_from_db()
        self.assertEqual(self.order.delivery_status, "shipped")

    def test_admin_ship_never_moves_a_delivered_item_backwards(self):
        OrderItem.objects.filter(seller=self.shop_a).update(fulfillment_status="delivered")
        set_delivery_status(self.order.id, "shipped")
        self.assertEqual(self.order.items.get(seller=self.shop_a).fulfillment_status, "delivered")
        self.assertEqual(self.order.items.get(seller=self.shop_b).fulfillment_status, "shipped")
