import django_filters
from django.db.models import Exists, OuterRef

from catalog.models import ProductVariant
from orders.models import Order, OrderItem

from .selectors import LOW_STOCK_THRESHOLD


class SellerOrderFilter(django_filters.FilterSet):
    fulfillment_status = django_filters.ChoiceFilter(
        choices=OrderItem.Fulfillment.choices, method="filter_fulfillment",
    )

    class Meta:
        model = Order
        fields = ["fulfillment_status"]

    def filter_fulfillment(self, queryset, name, value):
        # "orders where MY items are in this state", never anyone else's
        mine = OrderItem.objects.filter(
            order=OuterRef("pk"),
            seller=self.request.user.seller_profile,
            fulfillment_status=value,
        )
        return queryset.filter(Exists(mine))


class InventoryFilter(django_filters.FilterSet):
    low_stock = django_filters.BooleanFilter(method="filter_low")
    out_of_stock = django_filters.BooleanFilter(method="filter_out")

    class Meta:
        model = ProductVariant
        fields = ["low_stock", "out_of_stock"]

    def filter_low(self, queryset, name, value):
        low = queryset.filter(stock__gt=0, stock__lte=LOW_STOCK_THRESHOLD)
        return low if value else queryset.exclude(pk__in=low.values("pk"))

    def filter_out(self, queryset, name, value):
        return queryset.filter(stock=0) if value else queryset.filter(stock__gt=0)
