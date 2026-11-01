from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from sellers.testing import make_shop
from .models import Category, Product, ProductVariant

User = get_user_model()


class ProductListAPITests(APITestCase):
    def setUp(self):
        cat = Category.objects.create(name="Khimar")
        shop = make_shop()
        for i in range(15):
            p = Product.objects.create(
                name=f"Product {i}", regular_price=100 + i, is_active=True, seller=shop,
            )
            p.categories.add(cat)
            ProductVariant.objects.create(product=p, sku=f"SKU-{i}", stock=5)
        self.cat_slug = cat.slug

    def test_list_is_paginated_at_12(self):
        response = self.client.get("/api/products/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 12)
        self.assertEqual(response.data["count"], 15)

    def test_filter_by_category(self):
        response = self.client.get(f"/api/products/?category={self.cat_slug}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 15)

    def test_ordering_by_price_descending(self):
        response = self.client.get("/api/products/?ordering=-regular_price")
        prices = [item["regular_price"] for item in response.data["results"]]
        self.assertEqual(prices, sorted(prices, reverse=True))


class SlugAndImageConstraintTests(APITestCase):
    def setUp(self):
        self.shop = make_shop()

    def test_same_name_products_get_unique_slugs(self):
        a = Product.objects.create(name="Black Abaya", regular_price=100, seller=self.shop)
        b = Product.objects.create(name="Black Abaya", regular_price=100, seller=self.shop)
        self.assertEqual(a.slug, "black-abaya")
        self.assertEqual(b.slug, "black-abaya-2")

    def test_slug_is_stable_on_rename(self):
        p = Product.objects.create(name="Old Name", regular_price=100, seller=self.shop)
        p.name = "New Name"
        p.save()
        self.assertEqual(p.slug, "old-name")

    def test_non_ascii_name_still_gets_a_slug(self):
        p = Product.objects.create(name="\u0996\u09bf\u09ae\u09be\u09b0", regular_price=100, seller=self.shop)
        self.assertEqual(p.slug, "product")

    def test_many_gallery_images_but_one_primary(self):
        from django.db import IntegrityError, transaction
        from .models import ProductImage
        p = Product.objects.create(name="Abaya", regular_price=100, seller=self.shop)
        for n in range(3):
            ProductImage.objects.create(product=p, image=f"x{n}.jpg", is_primary=False)
        ProductImage.objects.create(product=p, image="main.jpg", is_primary=True)
        with self.assertRaises(IntegrityError), transaction.atomic():
            ProductImage.objects.create(product=p, image="main2.jpg", is_primary=True)
