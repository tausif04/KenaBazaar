
from django.db import models
from django.utils.text import slugify

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    # slug powers clean URLs like /shop/category/khimar/ (Day 2 work)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "categories"


class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(blank=True)
    regular_price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    seller = models.ForeignKey(
        "sellers.SellerProfile",
        on_delete=models.PROTECT,      # never silently delete a shop's products
        related_name="products",
    )
    categories = models.ManyToManyField(Category, related_name="products")

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def _build_unique_slug(self):
        base = slugify(self.name)[:200] or "product"   # leave room for "-N"; never empty
        slug, n = base, 2
        while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base}-{n}"
            n += 1
        return slug

    def save(self, *args, **kwargs):
        if not self.slug:                              # only on first save: URLs stay stable on rename
            self.slug = self._build_unique_slug()
        super().save(*args, **kwargs)

    @property
    def current_price(self):
        """Single source of truth for 'what does this cost right now.'
        Every view/template/API calls this instead of re-deriving the logic."""
        return self.sale_price if self.sale_price is not None else self.regular_price

    def __str__(self):
        return self.name


class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="variants"
    )
    size = models.CharField(max_length=20, null=True, blank=True)
    color = models.CharField(max_length=30, null=True, blank=True)
    sku = models.CharField(max_length=50, unique=True)
    stock = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("product", "size", "color")
        # prevents accidentally creating two "Product X, Size M, Red" rows

    def __str__(self):
        return f"{self.product.name} ({self.size}/{self.color})"


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="products/")
    alt_text = models.CharField(max_length=150, blank=True)
    is_primary = models.BooleanField(default=False)
    # is_primary lets you flag which image shows on the catalog grid
    # vs. the full gallery on the product detail page
    
    class Meta:
        ordering = ["-is_primary", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["product"],
                condition=models.Q(is_primary=True),
                name="one_primary_image_per_product",
            )
        ]

        # prevents accidentally creating two "primary" images for a product
    def __str__(self):
        return f"Image for {self.product.name}"
    