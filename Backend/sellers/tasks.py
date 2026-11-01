from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

from .models import SellerProfile

MESSAGES = {
    SellerProfile.Status.APPROVED: (
        "Your KenaBazaar seller account is approved",
        "Good news! {shop} has been approved. You can now list products and manage "
        "orders here: {url}",
    ),
    SellerProfile.Status.SUSPENDED: (
        "Your KenaBazaar seller account was suspended",
        "{shop} has been suspended and can no longer list products or fulfil orders. "
        "Please contact KenaBazaar support if you think this is a mistake.",
    ),
}


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def send_seller_status_email(self, profile_id):
    """Email the seller about their current status.

    Reads the status when the task RUNS (not when it was queued), so a slow worker
    never sends an outdated "approved" after the seller was suspended.
    """
    profile = SellerProfile.objects.select_related("user").filter(pk=profile_id).first()
    if profile is None or profile.status not in MESSAGES:
        return "skipped"
    subject, body = MESSAGES[profile.status]
    frontend = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    send_mail(
        subject=subject,
        message=body.format(shop=profile.shop_name, url=f"{frontend}/seller"),
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@kenabazaar.local"),
        recipient_list=[profile.user.email],
    )
    return "sent"
