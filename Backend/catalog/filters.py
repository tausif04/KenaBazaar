import django_filters
from .models import Product


class ProductFilter(django_filters.FilterSet):
    # M2M field — filter by the related Category's slug, joined through the M2M table
    category = django_filters.CharFilter(field_name="categories__slug", lookup_expr="exact")

    class Meta:
        model = Product
        fields = ["category"]

