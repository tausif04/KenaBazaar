from rest_framework import serializers
from .models import Category, Product, ProductVariant, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ["id", "size", "color", "sku", "stock"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "is_primary"]


class ProductSerializer(serializers.ModelSerializer):
    # nested, read-only: full objects embedded in the response
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)

    # flat, writable: client sends category IDs, not full objects
    categories = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Category.objects.all()
    )
    current_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True,
    )

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "description",
            "regular_price", "sale_price", "current_price",
            "categories", "is_active", "created_at", "updated_at",
            "variants", "images",
        ]

    def create(self, validated_data):
        categories = validated_data.pop("categories", [])
        product = Product.objects.create(**validated_data)
        product.categories.set(categories)
        return product

    def update(self, instance, validated_data):
        categories = validated_data.pop("categories", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if categories is not None:
            instance.categories.set(categories)
        return instance