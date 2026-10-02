from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Category, Product, ProductVariant

User = get_user_model()


class ProductListAPITests(APITestCase):
    def setUp(self):
        cat = Category.objects.create(name="Khimar")
        for i in range(15):
            p = Product.objects.create(
                name=f"Product {i}", regular_price=100 + i, is_active=True,
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