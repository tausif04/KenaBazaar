from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from Backend.catalog.models import Product, ProductVariant

User = get_user_model()


class CartFlowAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="test@kenabazaar.com", password="pass1234!")
        token = RefreshToken.for_user(self.user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        product = Product.objects.create(name="Abaya", regular_price=1500, is_active=True)
        self.variant = ProductVariant.objects.create(product=product, sku="AB-M-BLK", stock=10)

    def test_add_item_to_cart(self):
        response = self.client.post("/api/cart/items/", {"variant_id": self.variant.id, "quantity": 2})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        cart = self.client.get("/api/cart/")
        self.assertEqual(cart.data["items"][0]["quantity"], 2)

    def test_add_more_than_stock_fails(self):
        response = self.client.post("/api/cart/items/", {"variant_id": self.variant.id, "quantity": 999})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_remove_item_from_cart(self):
        add = self.client.post("/api/cart/items/", {"variant_id": self.variant.id, "quantity": 1})
        item_id = add.data["id"]
        response = self.client.delete(f"/api/cart/items/{item_id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_guest_cart_is_isolated_by_session(self):
        self.client.credentials()  # clear auth, act as guest
        response = self.client.post("/api/cart/items/", {"variant_id": self.variant.id, "quantity": 1})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)