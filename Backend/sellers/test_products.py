import io
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework.test import APITestCase

from catalog.models import Category, Product, ProductImage, ProductVariant
from orders.models import Order, OrderItem

from .testing import auth, make_seller

MEMORY_STORAGE = {
    "default": {"BACKEND": "django.core.files.storage.InMemoryStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}


def png(name="x.png", fmt="PNG", content_type="image/png"):
    buf = io.BytesIO()
    Image.new("RGB", (20, 20), "red").save(buf, fmt)
    return SimpleUploadedFile(name, buf.getvalue(), content_type=content_type)


class ProductWriteTests(APITestCase):
    def setUp(self):
        self.user_a, self.shop_a = make_seller("a@kb.com", "Shop A")
        self.user_b, self.shop_b = make_seller("b@kb.com", "Shop B")
        self.cat = Category.objects.create(name="Abaya")
        auth(self.client, self.user_a)

    def payload(self, **extra):
        data = {"name": "Black Abaya", "regular_price": "1500.00", "categories": [self.cat.id]}
        data.update(extra)
        return data

    def test_create_sets_owner_from_token_and_generates_slug(self):
        r = self.client.post("/api/seller/products/", self.payload(), format="json")
        self.assertEqual(r.status_code, 201, r.data)
        product = Product.objects.get(pk=r.data["id"])
        self.assertEqual(product.seller, self.shop_a)
        self.assertEqual(product.slug, "black-abaya")

    def test_client_cannot_choose_seller_or_slug(self):
        r = self.client.post(
            "/api/seller/products/",
            self.payload(seller=self.shop_b.id, slug="hijacked"), format="json",
        )
        self.assertEqual(r.status_code, 201)
        product = Product.objects.get(pk=r.data["id"])
        self.assertEqual(product.seller, self.shop_a)
        self.assertEqual(product.slug, "black-abaya")

    def test_same_name_in_two_shops_does_not_collide(self):
        self.client.post("/api/seller/products/", self.payload(), format="json")
        auth(self.client, self.user_b)
        r = self.client.post("/api/seller/products/", self.payload(), format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["slug"], "black-abaya-2")

    def test_category_is_required(self):
        r = self.client.post("/api/seller/products/", self.payload(categories=[]), format="json")
        self.assertEqual(r.status_code, 400)

    def test_sale_price_must_be_below_regular_price(self):
        r = self.client.post("/api/seller/products/", self.payload(sale_price="1500.00"), format="json")
        self.assertEqual(r.status_code, 400)
        self.assertIn("sale_price", r.data)

    def test_partial_update_revalidates_against_stored_price(self):
        r = self.client.post("/api/seller/products/", self.payload(), format="json")
        r = self.client.patch(f"/api/seller/products/{r.data['id']}/", {"sale_price": "2000.00"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_rename_keeps_slug_stable(self):
        r = self.client.post("/api/seller/products/", self.payload(), format="json")
        r = self.client.patch(f"/api/seller/products/{r.data['id']}/", {"name": "Renamed"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["slug"], "black-abaya")

    def test_cannot_edit_or_delete_another_sellers_product(self):
        theirs = Product.objects.create(name="Theirs", regular_price=10, seller=self.shop_b)
        self.assertEqual(self.client.patch(f"/api/seller/products/{theirs.id}/", {"name": "x"}).status_code, 404)
        self.assertEqual(self.client.delete(f"/api/seller/products/{theirs.id}/").status_code, 404)
        theirs.refresh_from_db()
        self.assertEqual(theirs.name, "Theirs")

    def test_delete_unsold_product_removes_it(self):
        r = self.client.post("/api/seller/products/", self.payload(), format="json")
        self.assertEqual(self.client.delete(f"/api/seller/products/{r.data['id']}/").status_code, 204)
        self.assertFalse(Product.objects.filter(pk=r.data["id"]).exists())

    def test_delete_product_with_order_history_is_409_not_500(self):
        product = Product.objects.create(name="Sold", regular_price=10, seller=self.shop_a)
        variant = ProductVariant.objects.create(product=product, sku="SOLD-1", stock=1)
        order = Order.objects.create(user=self.user_b, total=10, status="paid")
        OrderItem.objects.create(order=order, variant=variant, seller=self.shop_a,
                                 product_name="Sold", sku="SOLD-1", price_at_purchase=10, quantity=1)
        r = self.client.delete(f"/api/seller/products/{product.id}/")
        self.assertEqual(r.status_code, 409)
        self.assertTrue(Product.objects.filter(pk=product.pk).exists())

    def test_deactivated_product_leaves_public_shop_but_stays_in_seller_list(self):
        r = self.client.post("/api/seller/products/", self.payload(), format="json")
        self.client.patch(f"/api/seller/products/{r.data['id']}/", {"is_active": False}, format="json")
        self.assertEqual(self.client.get("/api/products/").data["count"], 0)
        self.assertEqual(self.client.get("/api/seller/products/").data["count"], 1)


class VariantTests(APITestCase):
    def setUp(self):
        self.user_a, self.shop_a = make_seller("a@kb.com", "Shop A")
        self.user_b, self.shop_b = make_seller("b@kb.com", "Shop B")
        self.mine = Product.objects.create(name="Mine", regular_price=10, seller=self.shop_a)
        self.theirs = Product.objects.create(name="Theirs", regular_price=10, seller=self.shop_b)
        auth(self.client, self.user_a)
        self.url = f"/api/seller/products/{self.mine.id}/variants/"

    def test_create_and_list(self):
        r = self.client.post(self.url, {"size": "M", "color": "Black", "sku": "M-BLK", "stock": 5})
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(len(self.client.get(self.url).data), 1)

    def test_duplicate_sku_is_400(self):
        self.client.post(self.url, {"sku": "DUP", "size": "M"})
        r = self.client.post(self.url, {"sku": "DUP", "size": "L"})
        self.assertEqual(r.status_code, 400)

    def test_duplicate_size_color_is_400_not_500(self):
        self.client.post(self.url, {"sku": "A1", "size": "M", "color": "Red"})
        r = self.client.post(self.url, {"sku": "A2", "size": "M", "color": "Red"})
        self.assertEqual(r.status_code, 400)

    def test_two_variants_without_size_and_color_are_blocked_too(self):
        self.client.post(self.url, {"sku": "A1"})
        self.assertEqual(self.client.post(self.url, {"sku": "A2"}).status_code, 400)

    def test_cannot_add_variant_to_another_sellers_product(self):
        r = self.client.post(f"/api/seller/products/{self.theirs.id}/variants/", {"sku": "X", "stock": 1})
        self.assertEqual(r.status_code, 404)
        self.assertEqual(self.theirs.variants.count(), 0)

    def test_cannot_touch_other_sellers_variant_via_my_product_url(self):
        theirs = ProductVariant.objects.create(product=self.theirs, sku="T1", stock=3)
        r = self.client.patch(f"{self.url}{theirs.id}/", {"stock": 999})
        self.assertEqual(r.status_code, 404)
        theirs.refresh_from_db()
        self.assertEqual(theirs.stock, 3)

    def test_product_cannot_be_reassigned_through_a_variant_update(self):
        v = ProductVariant.objects.create(product=self.mine, sku="V1", stock=1)
        self.client.patch(f"{self.url}{v.id}/", {"product": self.theirs.id, "stock": 2}, format="json")
        v.refresh_from_db()
        self.assertEqual(v.product_id, self.mine.id)
        self.assertEqual(v.stock, 2)

    def test_absurd_stock_is_rejected(self):
        r = self.client.post(self.url, {"sku": "BIG", "stock": 10**12})
        self.assertEqual(r.status_code, 400)

    def test_delete_variant_with_orders_is_409(self):
        v = ProductVariant.objects.create(product=self.mine, sku="V1", stock=1)
        order = Order.objects.create(user=self.user_b, total=10, status="paid")
        OrderItem.objects.create(order=order, variant=v, seller=self.shop_a,
                                 product_name="Mine", sku="V1", price_at_purchase=10, quantity=1)
        self.assertEqual(self.client.delete(f"{self.url}{v.id}/").status_code, 409)


@override_settings(STORAGES=MEMORY_STORAGE)
class ImageTests(APITestCase):
    def setUp(self):
        self.user_a, self.shop_a = make_seller("a@kb.com", "Shop A")
        self.user_b, self.shop_b = make_seller("b@kb.com", "Shop B")
        self.mine = Product.objects.create(name="Mine", regular_price=10, seller=self.shop_a)
        self.theirs = Product.objects.create(name="Theirs", regular_price=10, seller=self.shop_b)
        auth(self.client, self.user_a)
        self.url = f"/api/seller/products/{self.mine.id}/images/"

    def upload(self, **extra):
        return self.client.post(self.url, {"image": png(), **extra}, format="multipart")

    def test_first_image_becomes_primary_automatically(self):
        r = self.upload()
        self.assertEqual(r.status_code, 201, r.data)
        self.assertTrue(r.data["is_primary"])

    def test_many_gallery_images_but_only_one_primary(self):
        for _ in range(3):
            self.assertEqual(self.upload().status_code, 201)
        self.assertEqual(self.mine.images.filter(is_primary=True).count(), 1)
        self.assertEqual(self.mine.images.count(), 3)

    def test_uploading_a_new_primary_demotes_the_old_one(self):
        first = self.upload().data
        second = self.upload(is_primary="true").data
        self.assertTrue(second["is_primary"])
        self.assertFalse(ProductImage.objects.get(pk=first["id"]).is_primary)

    def test_make_primary_action(self):
        self.upload()
        other = self.upload().data
        r = self.client.post(f"{self.url}{other['id']}/make-primary/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(self.mine.images.get(is_primary=True).pk, other["id"])

    def test_deleting_the_primary_promotes_another_image(self):
        first = self.upload().data
        second = self.upload().data
        self.assertEqual(self.client.delete(f"{self.url}{first['id']}/").status_code, 204)
        self.assertEqual(self.mine.images.get(is_primary=True).pk, second["id"])

    def test_non_image_upload_is_rejected(self):
        bad = SimpleUploadedFile("evil.png", b"<script>alert(1)</script>", content_type="image/png")
        r = self.client.post(self.url, {"image": bad}, format="multipart")
        self.assertEqual(r.status_code, 400)
        self.assertEqual(self.mine.images.count(), 0)

    def test_unsupported_image_format_is_rejected(self):
        gif = png("x.gif", fmt="GIF", content_type="image/gif")
        self.assertEqual(self.client.post(self.url, {"image": gif}, format="multipart").status_code, 400)

    def test_oversized_image_is_rejected(self):
        with patch("sellers.serializers.MAX_IMAGE_BYTES", 10):
            self.assertEqual(self.upload().status_code, 400)

    def test_image_count_is_capped(self):
        with patch("sellers.views.MAX_IMAGES_PER_PRODUCT", 2):
            self.upload(); self.upload()
            self.assertEqual(self.upload().status_code, 400)

    def test_cannot_use_another_sellers_product(self):
        url = f"/api/seller/products/{self.theirs.id}/images/"
        self.assertEqual(self.client.post(url, {"image": png()}, format="multipart").status_code, 404)
        self.assertEqual(self.client.get(url).status_code, 404)
