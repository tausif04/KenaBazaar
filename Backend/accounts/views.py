from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views.decorators.csrf import csrf_protect
from rest_framework import generics, permissions, serializers, status, views
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from cart.services import CartService
from .serializers import RegisterSerializer

User = get_user_model()
REFRESH_COOKIE_NAME = "kenabazaar_refresh"


def set_refresh_cookie(response, token):
    """Store refresh JWT in a browser-managed, HttpOnly cookie."""
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=str(token),
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        httponly=True,
        secure=not settings.DEBUG,
        samesite="None" if not settings.DEBUG else "Lax",
        path="/api/auth/",
    )


def clear_refresh_cookie(response):
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/api/auth/",
        samesite="None" if not settings.DEBUG else "Lax",
    )


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(TokenObtainPairView):
    """Issue access JWT and HttpOnly refresh cookie, then merge guest cart."""
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            refresh = response.data.pop("refresh", None)
            if refresh:
                set_refresh_cookie(response, refresh)
            user = User.objects.get(email=request.data.get("email"))
            CartService.merge_guest_cart_into_user(request, user)
        return response


class RefreshCookieView(TokenRefreshView):
    """Rotate the refresh JWT from the HttpOnly cookie; return access only."""
    permission_classes = [permissions.AllowAny]

    @method_decorator(csrf_protect)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        refresh = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if not refresh:
            return Response({"detail": "Refresh session is missing."}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = self.get_serializer(data={"refresh": refresh})
        try:
            serializer.is_valid(raise_exception=True)
        except InvalidToken:
            response = Response({"detail": "Refresh session is invalid or expired."}, status=status.HTTP_401_UNAUTHORIZED)
            clear_refresh_cookie(response)
            return response

        data = dict(serializer.validated_data)
        rotated_refresh = data.pop("refresh", None)
        response = Response(data, status=status.HTTP_200_OK)
        if rotated_refresh:
            set_refresh_cookie(response, rotated_refresh)
        return response


class LogoutView(views.APIView):
    """Blacklist the refresh cookie and clear the browser session."""
    permission_classes = [permissions.AllowAny]

    @method_decorator(csrf_protect)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def post(self, request):
        refresh = request.COOKIES.get(REFRESH_COOKIE_NAME)
        response = Response(status=status.HTTP_205_RESET_CONTENT)
        if refresh:
            try:
                RefreshToken(refresh).blacklist()
            except TokenError:
                # Clear stale/invalid cookies as well; local logout should still succeed.
                pass
        clear_refresh_cookie(response)
        return response


class CurrentUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            "id": request.user.pk,
            "email": request.user.email,
            "full_name": request.user.full_name,
        })


class CsrfTokenView(views.APIView):
    """Issue a CSRF token for cross-origin cookie-backed auth requests."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"csrfToken": get_token(request)})


class PasswordResetRequestView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not isinstance(email, str) or not email.strip():
            return Response({"email": "This field is required."}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.filter(email=email.strip()).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
            reset_url = f"{frontend_url}/reset-password/{uid}/{token}"
            send_mail(
                subject="Reset your KenaBazaar password",
                message=f"Use this link to reset your password: {reset_url}",
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@kenabazaar.local"),
                recipient_list=[email.strip()],
            )
        # Same response regardless of whether the account exists.
        return Response({"detail": "If that email exists, a reset link was sent."})


class PasswordResetConfirmSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    password2 = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        try:
            validate_password(attrs["password"])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        return attrs


class PasswordResetConfirmView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, uidb64, token):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, UnicodeDecodeError):
            return Response({"detail": "Invalid link."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data["password"])
        user.save(update_fields=["password"])
        return Response({"detail": "Password updated."})
