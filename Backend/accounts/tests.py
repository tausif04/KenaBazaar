from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .views import REFRESH_COOKIE_NAME

User = get_user_model()


class AuthFlowAPITests(APITestCase):
    def test_register_creates_user_with_hashed_password(self):
        response = self.client.post("/api/auth/register/", {
            "email": "new@kenabazaar.com", "full_name": "Test User",
            "password": "SomeStrongPass1!", "password2": "SomeStrongPass1!",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="new@kenabazaar.com")
        self.assertNotEqual(user.password, "SomeStrongPass1!")

    def test_register_rejects_mismatched_passwords(self):
        response = self.client.post("/api/auth/register/", {
            "email": "x@kenabazaar.com", "password": "SomeStrongPass1!", "password2": "different!",
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_returns_access_and_sets_httponly_refresh_cookie(self):
        User.objects.create_user(email="login@kenabazaar.com", password="SomeStrongPass1!")
        response = self.client.post("/api/auth/login/", {
            "email": "login@kenabazaar.com", "password": "SomeStrongPass1!",
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertNotIn("refresh", response.data)
        self.assertIn(REFRESH_COOKIE_NAME, response.cookies)
        self.assertTrue(response.cookies[REFRESH_COOKIE_NAME]["httponly"])

    def test_wrong_password_rejected(self):
        User.objects.create_user(email="login2@kenabazaar.com", password="Correct1!")
        response = self.client.post("/api/auth/login/", {
            "email": "login2@kenabazaar.com", "password": "wrong",
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_returns_current_user_fields(self):
        user = User.objects.create_user(
            email="profile@kenabazaar.com", password="SomeStrongPass1!", full_name="Profile User"
        )
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {
            "id": user.pk, "email": user.email, "full_name": user.full_name,
        })

    def test_password_reset_confirm_rejects_mismatched_passwords(self):
        response = self.client.post("/api/auth/password-reset/confirm/invalid/invalid/", {
            "password": "SomeStrongPass1!", "password2": "DifferentStrongPass2!",
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password2", response.data)

    def test_csrf_endpoint_returns_token(self):
        response = self.client.get("/api/auth/csrf/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("csrfToken", response.data)
        self.assertIn("csrftoken", response.cookies)
