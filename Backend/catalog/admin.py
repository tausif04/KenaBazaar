from django.contrib import admin

from .models import Category, Product, ProductImage, ProductVariant


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 3  # any number of gallery images; the DB allows at most one primary


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "seller", "regular_price", "sale_price", "is_active", "created_at")
    list_filter = ("is_active", "seller", "categories")
    search_fields = ("name", "description")
    filter_horizontal = ("categories",)
    autocomplete_fields = ("seller",)  # needs SellerProfileAdmin.search_fields
    inlines = [ProductVariantInline, ProductImageInline]
    list_select_related = ("seller",)  # avoids one seller query per row (N+1)
    readonly_fields = ("slug",)       # generated in Product.save(), unique by construction