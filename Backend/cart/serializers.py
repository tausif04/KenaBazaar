from rest_framework import serializers

from catalog.models import Product, ProductVariant
from catalog.serializers import ProductSerializer, ProductVariantSerializer

from .models import Cart, CartItem, WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)  # nested, for display
    product_id = serializers.PrimaryKeyRelatedField(  # flat, for writing
        queryset=Product.objects.all(), source="product", write_only=True,
    )

    class Meta:
        model = WishlistItem
        fields = ["id", "product", "product_id", "added_at"]


class CartProductSerializer(serializers.ModelSerializer):
    """Small product summary for cart rows (not the full product with all variants/images)."""

    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["id", "name", "slug", "regular_price", "sale_price", "current_price", "image"]

    def get_image(self, obj):
        images = list(obj.images.all())  # uses the prefetch, no extra query
        chosen = next((i for i in images if i.is_primary), images[0] if images else None)
        return chosen.image.url if chosen else None


class CartItemSerializer(serializers.ModelSerializer):
    variant = ProductVariantSerializer(read_only=True)  # nested, for display
    product = CartProductSerializer(source="variant.product", read_only=True)
    variant_id = serializers.PrimaryKeyRelatedField(  # flat, for writing
        queryset=ProductVariant.objects.all(), source="variant", write_only=True,
    )
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ["id", "product", "variant", "variant_id", "quantity", "subtotal"]

    def get_subtotal(self, obj):
        return obj.variant.product.current_price * obj.quantity

    def validate(self, data):
        variant = data.get("variant") or getattr(self.instance, "variant", None)
        quantity = data.get("quantity", getattr(self.instance, "quantity", 1))
        if variant and quantity > variant.stock:
            raise serializers.ValidationError(f"Only {variant.stock} in stock.")
        return data


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["id", "items", "total"]

    def get_total(self, obj):
        return sum(i.variant.product.current_price * i.quantity for i in obj.items.all())
