from rest_framework import serializers
from Backend.catalog.models import ProductVariant
from Backend.catalog.serializers import ProductVariantSerializer
from .models import Cart, CartItem
from Backend.catalog.serializers import ProductSerializer
from Backend.catalog.models import Product
from .models import WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)                         # nested, for display
    product_id = serializers.PrimaryKeyRelatedField(                     # flat, for writing
        queryset=Product.objects.all(), source="product", write_only=True,
    )

    class Meta:
        model = WishlistItem
        fields = ["id", "product", "product_id", "added_at"]

class CartItemSerializer(serializers.ModelSerializer):
    variant = ProductVariantSerializer(read_only=True)                 # nested, for display
    variant_id = serializers.PrimaryKeyRelatedField(                    # flat, for writing
        queryset=ProductVariant.objects.all(), source="variant", write_only=True,
    )
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ["id", "variant", "variant_id", "quantity", "subtotal"]

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