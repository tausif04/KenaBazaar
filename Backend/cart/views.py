from rest_framework import views, viewsets, permissions, status
from rest_framework.response import Response

from .models import CartItem, WishlistItem
from .serializers import CartSerializer, CartItemSerializer, WishlistItemSerializer
from .services import CartService


class CartView(views.APIView):
    permission_classes = [permissions.AllowAny]  # guests must reach this

    def get(self, request):
        cart = CartService.get_cart(request)
        return Response(CartSerializer(cart).data)


class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.AllowAny]
    http_method_names = ["post", "patch", "delete"]  # no list/retrieve here — CartView owns that

    def get_queryset(self):
        # scoping every lookup to THIS request's cart IS the ownership check —
        # see explanation below
        cart = CartService.get_cart(self.request)
        return CartItem.objects.filter(cart=cart)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = CartService.get_cart(request)
        variant = serializer.validated_data["variant"]
        quantity = serializer.validated_data.get("quantity", 1)

        item, created = CartItem.objects.get_or_create(
            cart=cart, variant=variant, defaults={"quantity": quantity},
        )
        if not created:
            item.quantity += quantity
            item.save()

        return Response(self.get_serializer(item).data, status=status.HTTP_201_CREATED)


class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete"]  # no PATCH/PUT — nothing on a wishlist row to update

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.validated_data["product"]

        item, created = WishlistItem.objects.get_or_create(
            user=request.user, product=product,
        )
        response_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(self.get_serializer(item).data, status=response_status)