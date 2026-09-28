import stripe
from django.conf import settings
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order
from .serializers import CheckoutSerializer, OrderSerializer
from .services import create_order_from_cart, mark_order_paid

class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]   # Customer only, per your Use Case diagram

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = create_order_from_cart(request.user, serializer.validated_data)

        session = stripe.checkout.Session.create(
            api_key=settings.STRIPE_SECRET_KEY,
            mode="payment",
            client_reference_id=str(order.id),
            metadata={"order_id": str(order.id)},
            customer_email=request.user.email,
            line_items=[{
                "price_data": {
                    "currency": settings.STRIPE_CURRENCY,
                    "unit_amount": int((i.price_at_purchase * 100).to_integral_value()),
                    "product_data": {"name": i.product_name},
                },
                "quantity": i.quantity,
            } for i in order.items.all()],
            success_url=f"{settings.FRONTEND_URL}/order/success?order={order.id}",
            cancel_url=f"{settings.FRONTEND_URL}/cart",
        )
        order.stripe_session_id = session.id
        order.save(update_fields=["stripe_session_id"])
        return Response(
            {"order_id": order.id, "checkout_url": session.url},
            status=status.HTTP_201_CREATED,
        )


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items")


@api_view(["POST"])
@authentication_classes([])                       # no JWT/session: Stripe isn't a user
@permission_classes([permissions.AllowAny])       # the ONE intentional AllowAny; signature is the auth
def stripe_webhook(request):
    payload = request.body
    signature = request.META.get("HTTP_STRIPE_SIGNATURE", "")
    try:
        event = stripe.Webhook.construct_event(
            payload, signature, settings.STRIPE_WEBHOOK_SECRET,
        )
    except (ValueError, stripe.SignatureVerificationError):
        return Response(status=status.HTTP_400_BAD_REQUEST)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        if session.get("payment_status") == "paid":
            mark_order_paid(int(session["metadata"]["order_id"]))

    return Response(status=status.HTTP_200_OK)    # 200 for events we ignore, so Stripe stops retrying