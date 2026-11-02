"""Small helpers shared by test modules (not imported by production code)."""
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from .models import SellerProfile

User = get_user_model()


def make_user(email):
    return User.objects.create_user(email=email, password="pass1234!")


def auth(client, user):
    token = RefreshToken.for_user(user).access_token
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")


def make_seller(email, shop, status=SellerProfile.Status.APPROVED):
    user = make_user(email)
    return user, SellerProfile.objects.create(user=user, shop_name=shop, status=status)


def make_shop(shop="Test Shop", email=None):
    """Just the approved SellerProfile, for tests that only need a product owner."""
    return make_seller(email or f"{shop.lower().replace(' ', '')}@kb.com", shop)[1]
