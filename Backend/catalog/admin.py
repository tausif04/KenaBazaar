from django.contrib import admin

from .models import Category, Product, ProductImage, ProductVariant


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1  # note: the model allows at most one primary + one non-primary image


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "regular_price", "sale_price", "is_active", "created_at")
    list_filter = ("is_active", "categories")
    search_fields = ("name", "description")
    filter_horizontal = ("categories",)
    inlines = [ProductVariantInline, ProductImageInline]