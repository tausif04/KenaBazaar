from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, LogoutView, PasswordResetRequestView, PasswordResetConfirmView

urlpatterns = [
    path("auth/register/", RegisterView.as_view()),
    path("auth/login/", LoginView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),   # built-in — no reason to write this ourselves
    path("auth/logout/", LogoutView.as_view()),
    path("auth/password-reset/", PasswordResetRequestView.as_view()),
    path("auth/password-reset/confirm/<uidb64>/<token>/", PasswordResetConfirmView.as_view()),
]