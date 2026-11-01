from django.conf import settings
from django.db import models
from django.utils.text import slugify


class SellerProfile(models.Model):
    """A shop owned by one user. Separate from User so identity (accounts)
    and marketplace data (shop name, approval) stay in their own domains."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending approval"
        APPROVED = "approved", "Approved"
        SUSPENDED = "suspended", "Suspended"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="seller_profile",
    )
    shop_name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.shop_name) or f"shop-{self.user_id}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.shop_name
