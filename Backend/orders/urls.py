from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CheckoutView, OrderViewSet, stripe_webhook

router = DefaultRouter()
router.register("orders", OrderViewSet, basename="order")

urlpatterns = [
    path("checkout/session/", CheckoutView.as_view()),
    path("webhooks/stripe/", stripe_webhook),
] + router.urls


