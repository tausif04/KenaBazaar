# orders/admin.py
from django.contrib import admin, messages

from .models import Order, OrderItem
from .services import set_delivery_status


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    fields = (
        "product_name", "sku", "quantity", "price_at_purchase",
        "seller", "fulfillment_status", "courier", "tracking_number",
    )
    readonly_fields = fields  # snapshots must never be edited

    def has_add_permission(self, request, obj=None):
        return False

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("seller")  # avoids N+1 on seller


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "delivery_status", "total", "created_at")
    list_filter = ("status", "delivery_status")
    search_fields = ("id", "user__email", "shipping_name", "tracking_number")
    list_select_related = ("user",)  # avoids one user query per row (N+1)
    inlines = [OrderItemInline]
    actions = ["mark_shipped", "mark_delivered"]

    # State fields change only through set_delivery_status / the Stripe webhook.
    # courier and tracking_number stay editable (plain data, no transition rules).
    readonly_fields = (
        "status", "paid_at",
        "delivery_status", "shipped_at", "delivered_at",
    )

    def _transition(self, request, queryset, new_status):
        done = 0
        for order in queryset:
            try:
                set_delivery_status(order.pk, new_status)
                done += 1
            except ValueError as e:
                self.message_user(request, f"Order #{order.pk}: {e}", level=messages.ERROR)
        if done:
            self.message_user(request, f"{done} order(s) marked {new_status}.", level=messages.SUCCESS)

    @admin.action(description="Mark selected orders as shipped")
    def mark_shipped(self, request, queryset):
        self._transition(request, queryset, "shipped")

    @admin.action(description="Mark selected orders as delivered")
    def mark_delivered(self, request, queryset):
        self._transition(request, queryset, "delivered")