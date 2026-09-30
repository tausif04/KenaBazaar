from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class AuthFlowAPITests(APITestCase):
    def test_register_creates_user_with_hashed_password(self):
        response = self.client.post("/api/auth/register/", {
            "email": "new@kenabazaar.com", "full_name": "Test User",
            "password": "SomeStrongPass1!", "password2": "SomeStrongPass1!",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="new@kenabazaar.com")
        self.assertNotEqual(user.password, "SomeStrongPass1!")  # never stored raw

    def test_register_rejects_mismatched_passwords(self):
        response = self.client.post("/api/auth/register/", {
            "email": "x@kenabazaar.com", "password": "abc12345!", "password2": "different!",
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_returns_access_and_refresh(self):
        User.objects.create_user(email="login@kenabazaar.com", password="SomeStrongPass1!")
        response = self.client.post("/api/auth/login/", {
            "email": "login@kenabazaar.com", "password": "SomeStrongPass1!",
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_wrong_password_rejected(self):
        User.objects.create_user(email="login2@kenabazaar.com", password="Correct1!")
        response = self.client.post("/api/auth/login/", {
            "email": "login2@kenabazaar.com", "password": "wrong",
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)