from rest_framework.permissions import BasePermission

from .models import SellerProfile


def get_approved_profile(user):
    """Return the user's SellerProfile only if it is currently approved.

    Read from the database on every request (never from the JWT), so
    suspending a seller takes effect on their very next call.
    """
    if not (user and user.is_authenticated):
        return None
    profile = getattr(user, "seller_profile", None)  # None when the user has no profile
    if profile is not None and profile.status == SellerProfile.Status.APPROVED:
        return profile
    return None


class IsApprovedSeller(BasePermission):
    """Role check: is this user an approved seller? (runs for every request)"""

    message = "An approved seller account is required."

    def has_permission(self, request, view):
        return get_approved_profile(request.user) is not None


class IsOwnedBySeller(BasePermission):
    """Object check: does this row belong to the requesting seller?

    Works for any model with a `seller` FK (Product now, OrderItem in step 3).
    It is a second line of defence: the real IDOR protection is scoping the
    queryset, because has_object_permission is never called for list views.
    """

    def has_object_permission(self, request, view, obj):
        profile = get_approved_profile(request.user)
        return profile is not None and obj.seller_id == profile.id
