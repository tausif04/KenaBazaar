from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    SellerApplyView, SellerDashboardView, SellerImageViewSet, SellerInventoryViewSet,
    SellerOrderViewSet, SellerProductViewSet, SellerProfileView, SellerVariantViewSet,
)

router = DefaultRouter()
router.register("seller/products", SellerProductViewSet, basename="seller-product")
router.register("seller/inventory", SellerInventoryViewSet, basename="seller-inventory")
router.register("seller/orders", SellerOrderViewSet, basename="seller-order")

variants = SellerVariantViewSet.as_view({"get": "list", "post": "create"})
variant = SellerVariantViewSet.as_view(
    {"get": "retrieve", "patch": "partial_update", "put": "update", "delete": "destroy"}
)
images = SellerImageViewSet.as_view({"get": "list", "post": "create"})
image = SellerImageViewSet.as_view({"delete": "destroy"})
image_primary = SellerImageViewSet.as_view({"post": "make_primary"})

urlpatterns = [
    path("seller/apply/", SellerApplyView.as_view(), name="seller-apply"),
    path("seller/profile/", SellerProfileView.as_view(), name="seller-profile"),
    path("seller/dashboard/", SellerDashboardView.as_view(), name="seller-dashboard"),
    path("seller/products/<int:product_pk>/variants/", variants, name="seller-variant-list"),
    path("seller/products/<int:product_pk>/variants/<int:pk>/", variant, name="seller-variant-detail"),
    path("seller/products/<int:product_pk>/images/", images, name="seller-image-list"),
    path("seller/products/<int:product_pk>/images/<int:pk>/", image, name="seller-image-detail"),
    path("seller/products/<int:product_pk>/images/<int:pk>/make-primary/", image_primary,
         name="seller-image-primary"),
] + router.urls
