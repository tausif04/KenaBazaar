from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CartView, CartItemViewSet, WishlistViewSet

router = DefaultRouter()
router.register("cart/items", CartItemViewSet, basename="cart-item")
router.register("wishlist", WishlistViewSet, basename="wishlist")

urlpatterns = [path("cart/", CartView.as_view(), name="cart-detail")] + router.urls