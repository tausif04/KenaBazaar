from django.conf import settings
from django.db import models
from catalog.models import ProductVariant


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending payment"
        PAID = "paid", "Paid"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders",
    )
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    shipping_name = models.CharField(max_length=150)
    shipping_phone = models.CharField(max_length=20)
    shipping_address = models.TextField()
    stripe_session_id = models.CharField(max_length=255, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT)
    product_name = models.CharField(max_length=200)          # snapshot
    sku = models.CharField(max_length=64)                     # snapshot
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2)  # snapshot
    quantity = models.PositiveIntegerField()

    @property
    def line_total(self):
        return self.price_at_purchase * self.quantity