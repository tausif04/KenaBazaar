import logging

from django.db import transaction

from .tasks import send_seller_status_email

logger = logging.getLogger(__name__)


def queue_status_email(profile_id):
    """Queue the email only AFTER the status change is committed.

    Otherwise the worker could run before the commit, read the old status and
    send the wrong message. A broker outage must never break the admin's save,
    so failures are logged instead of raised.
    """
    def _enqueue():
        try:
            send_seller_status_email.delay(profile_id)
        except Exception:
            logger.exception("Could not queue status email for seller %s", profile_id)

    transaction.on_commit(_enqueue)
