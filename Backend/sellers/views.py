from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import (
    Count, DecimalField, ExpressionWrapper, F, ProtectedError, Q, Sum, Value,
)
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import APIException, NotFound, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from catalog.filters import ProductFilter
from catalog.models import Product, ProductVariant
from catalog.pagination import ProductPagination
from orders.models import Order
from orders.services import set_seller_fulfillment

from .filters import InventoryFilter, SellerOrderFilter
from .permissions import IsApprovedSeller, IsOwnedBySeller
from .selectors import (
    LOW_STOCK_THRESHOLD, seller_orders, seller_paid_items, seller_products, seller_variants,
)
from .serializers import (
    FulfillmentUpdateSerializer, MAX_IMAGES_PER_PRODUCT, SellerApplySerializer,
    SellerImageSerializer, SellerInventorySerializer, SellerOrderSerializer,
    SellerProductSerializer, SellerProfileSerializer, SellerVariantSerializer,
)


class Conflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "This action conflicts with the current state."
    default_code = "conflict"


# ---------- application & profile ----------

class SellerApplyView(generics.CreateAPIView):
    """Any logged-in user may apply. The result is always a PENDING profile."""

    serializer_class = SellerApplySerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "seller_apply"

    def perform_create(self, serializer):
        # The owner comes from the verified token, never from the request body.
        serializer.save(user=self.request.user)


class SellerProfileView(generics.RetrieveUpdateAPIView):
    """Own shop details. Open to pending and suspended sellers too, so the UI
    can show their status; they simply cannot reach anything else."""

    serializer_class = SellerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        profile = getattr(self.request.user, "seller_profile", None)
        if profile is None:
            raise NotFound("You have not applied to become a seller.")
        return profile


# ---------- products ----------

class SellerProductViewSet(viewsets.ModelViewSet):
    """Full CRUD on the seller's own products (inactive ones included)."""

    serializer_class = SellerProductSerializer
    pagination_class = ProductPagination
    permission_classes = [IsApprovedSeller, IsOwnedBySeller]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_class = ProductFilter
    ordering_fields = ["regular_price", "created_at"]
    ordering = ["-created_at"]
    search_fields = ["name", "description"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):   # schema generation has no real user
            return Product.objects.none()
        # Scoping the queryset is what actually stops IDOR: another seller's
        # product id does not exist in this queryset, so detail/update/delete return 404.
        return seller_products(self.request.user.seller_profile)

    def perform_create(self, serializer):
        # The owner is set here from the token; it is not a serializer field.
        serializer.save(seller=self.request.user.seller_profile)

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            raise Conflict(
                "This product has order history and cannot be deleted. "
                "Set is_active to false to hide it from the shop instead."
            )


class ProductScopedMixin:
    """Nested routes: /seller/products/<product_pk>/... The product is looked up
    inside the seller's own products, so someone else's id is a 404."""

    def get_product(self):
        if not hasattr(self, "_product"):
            self._product = get_object_or_404(
                Product, pk=self.kwargs["product_pk"], seller=self.request.user.seller_profile,
            )
        return self._product


class SellerVariantViewSet(ProductScopedMixin, viewsets.ModelViewSet):
    serializer_class = SellerVariantSerializer
    permission_classes = [IsApprovedSeller]
    pagination_class = None

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Product.objects.none()
        return self.get_product().variants.all()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if not getattr(self, "swagger_fake_view", False):
            context["product"] = self.get_product()
        return context

    def perform_create(self, serializer):
        serializer.save(product=self.get_product())

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            raise Conflict(
                "This variant has order history and cannot be deleted. Set its stock to 0 instead."
            )


class SellerImageViewSet(
    ProductScopedMixin, mixins.ListModelMixin, mixins.CreateModelMixin,
    mixins.DestroyModelMixin, viewsets.GenericViewSet,
):
    serializer_class = SellerImageSerializer
    permission_classes = [IsApprovedSeller]
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = None

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Product.objects.none()
        return self.get_product().images.all()

    @transaction.atomic
    def perform_create(self, serializer):
        # Lock the product row so two simultaneous uploads cannot both become
        # primary (the DB constraint would turn that race into a 500).
        product = Product.objects.select_for_update().get(pk=self.get_product().pk)
        if product.images.count() >= MAX_IMAGES_PER_PRODUCT:
            raise ValidationError(f"A product can have at most {MAX_IMAGES_PER_PRODUCT} images.")
        make_primary = serializer.validated_data.get("is_primary") or not product.images.exists()
        if make_primary:
            product.images.filter(is_primary=True).update(is_primary=False)
        serializer.save(product=product, is_primary=make_primary)

    @transaction.atomic
    def perform_destroy(self, instance):
        product = Product.objects.select_for_update().get(pk=instance.product_id)
        was_primary = instance.is_primary
        instance.delete()
        if was_primary:                                   # never leave a gallery without a cover
            successor = product.images.order_by("id").first()
            if successor:
                successor.is_primary = True
                successor.save(update_fields=["is_primary"])

    @action(detail=True, methods=["post"], url_path="make-primary")
    @transaction.atomic
    def make_primary(self, request, *args, **kwargs):
        image = self.get_object()
        product = Product.objects.select_for_update().get(pk=image.product_id)
        product.images.filter(is_primary=True).update(is_primary=False)
        image.is_primary = True
        image.save(update_fields=["is_primary"])
        return Response(self.get_serializer(image).data)


# ---------- inventory ----------

class SellerInventoryViewSet(mixins.ListModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    """Every variant the seller owns, lowest stock first; PATCH {"stock": n} to adjust."""

    serializer_class = SellerInventorySerializer
    permission_classes = [IsApprovedSeller]
    pagination_class = ProductPagination
    http_method_names = ["get", "patch", "head", "options"]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_class = InventoryFilter
    ordering_fields = ["stock", "sku"]
    ordering = ["stock", "id"]
    search_fields = ["sku", "product__name"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return ProductVariant.objects.none()
        return seller_variants(self.request.user.seller_profile)

    def perform_update(self, serializer):
        # Write only the stock column, so this cannot clobber other fields.
        instance = serializer.instance
        instance.stock = serializer.validated_data["stock"]
        instance.save(update_fields=["stock"])


# ---------- orders ----------

class SellerOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """Paid orders containing this seller's items, showing ONLY those items."""

    serializer_class = SellerOrderSerializer
    permission_classes = [IsApprovedSeller]
    pagination_class = ProductPagination
    filter_backends = [DjangoFilterBackend]
    filterset_class = SellerOrderFilter

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Order.objects.none()
        return seller_orders(self.request.user.seller_profile)

    @action(detail=True, methods=["post"], url_path="fulfillment")
    def fulfillment(self, request, pk=None):
        order = self.get_object()                          # 404 unless it holds my items
        body = FulfillmentUpdateSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        try:
            set_seller_fulfillment(
                order.pk, request.user.seller_profile,
                body.validated_data["status"],
                body.validated_data.get("courier", "").strip(),
                body.validated_data.get("tracking_number", "").strip(),
            )
        except ValueError as exc:
            raise Conflict(str(exc))
        fresh = self.get_queryset().get(pk=order.pk)       # re-read with the seller-only prefetch
        return Response(self.get_serializer(fresh).data)


# ---------- dashboard ----------

class SellerDashboardView(APIView):
    permission_classes = [IsApprovedSeller]

    def get(self, request):
        shop = request.user.seller_profile
        money = ExpressionWrapper(
            F("price_at_purchase") * F("quantity"),
            output_field=DecimalField(max_digits=14, decimal_places=2),
        )
        zero = Value(Decimal("0.00"), output_field=DecimalField(max_digits=14, decimal_places=2))
        since = timezone.now() - timedelta(days=30)

        sales = seller_paid_items(shop).aggregate(
            gross_sales=Coalesce(Sum(money), zero),
            gross_sales_30d=Coalesce(Sum(money, filter=Q(order__paid_at__gte=since)), zero),
            units_sold=Coalesce(Sum("quantity"), 0),
            orders=Count("order", distinct=True),
            orders_to_ship=Count("order", filter=Q(fulfillment_status="processing"), distinct=True),
        )
        for key in ("gross_sales", "gross_sales_30d"):
            # explicit 2-decimal strings: SQLite and PostgreSQL otherwise return
            # differently-scaled Decimals ("250" vs "250.00")
            sales[key] = str(Decimal(sales[key]).quantize(Decimal("0.01")))
        products = seller_products(shop).aggregate(
            total=Count("id"), active=Count("id", filter=Q(is_active=True)),
        )
        live = seller_variants(shop).filter(product__is_active=True)
        stock = live.aggregate(
            out_of_stock=Count("id", filter=Q(stock=0)),
            low_stock=Count("id", filter=Q(stock__gt=0, stock__lte=LOW_STOCK_THRESHOLD)),
        )
        low_variants = live.filter(stock__lte=LOW_STOCK_THRESHOLD).order_by("stock", "id")[:10]

        return Response({
            "sales": sales,
            "products": products,
            "stock": {**stock, "threshold": LOW_STOCK_THRESHOLD},
            "recent_orders": SellerOrderSerializer(seller_orders(shop)[:5], many=True).data,
            "low_stock_variants": SellerInventorySerializer(low_variants, many=True).data,
        })
