from rest_framework import serializers
from .models import Order, OrderItem


class CheckoutSerializer(serializers.Serializer):     # plain Serializer: not a 1:1 model
    shipping_name = serializers.CharField(max_length=150)
    shipping_phone = serializers.CharField(max_length=20)
    shipping_address = serializers.CharField()


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product_name", "sku", "price_at_purchase", "quantity", "line_total"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ["id", "status", "total", "shipping_name", "shipping_phone",
                  "shipping_address", "items", "created_at", "paid_at"]
        read_only_fields = fields