from datetime import timedelta
from unittest.mock import patch

from django.core import mail
from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework.throttling import ScopedRateThrottle

from catalog.models import Product, ProductVariant
from orders.models import Order

from .models import SellerProfile
from .tasks import send_seller_status_email
from .test_inventory_orders import MarketplaceFixture, make_order
from .testing import User, auth, make_seller, make_user


class DashboardTests(MarketplaceFixture, APITestCase):
    def setUp(self):
        self.build()
        make_order(self.buyer, [(self.va, 2, 100)])                      # A: 200
        old = make_order(self.buyer, [(self.va, 1, 50)])                 # A: 50, but 40 days ago
        Order.objects.filter(pk=old.pk).update(paid_at=timezone.now() - timedelta(days=40))
        make_order(self.buyer, [(self.va, 9, 100)], status="pending")    # unpaid: ignored
        make_order(self.buyer, [(self.vb, 5, 50)])                       # other seller: ignored
        Product.objects.create(name="Hidden", regular_price=1, seller=self.shop_a, is_active=False)
        ProductVariant.objects.create(product=self.va.product, sku="A-ZERO", stock=0, size="L")
        auth(self.client, self.user_a)

    def test_numbers(self):
        d = self.client.get("/api/seller/dashboard/").data
        self.assertEqual(d["sales"]["gross_sales"], "250.00")
        self.assertEqual(d["sales"]["gross_sales_30d"], "200.00")
        self.assertEqual(d["sales"]["units_sold"], 3)
        self.assertEqual(d["sales"]["orders"], 2)
        self.assertEqual(d["sales"]["orders_to_ship"], 2)
        self.assertEqual(d["products"], {"total": 2, "active": 1})
        self.assertEqual(d["stock"]["out_of_stock"], 1)
        self.assertEqual(d["stock"]["low_stock"], 1)          # A-1 has stock 3

    def test_low_stock_list_and_recent_orders_are_scoped(self):
        d = self.client.get("/api/seller/dashboard/").data
        self.assertEqual([v["sku"] for v in d["low_stock_variants"]], ["A-ZERO", "A-1"])
        self.assertEqual(len(d["recent_orders"]), 2)
        self.assertNotIn("B-1", str(d))

    def test_new_seller_gets_zeroes_not_errors(self):
        user, _ = make_seller("n@kb.com", "Newbie")
        auth(self.client, user)
        d = self.client.get("/api/seller/dashboard/").data
        self.assertEqual(d["sales"]["gross_sales"], "0.00")
        self.assertEqual(d["sales"]["units_sold"], 0)
        self.assertEqual(d["recent_orders"], [])

    def test_pending_seller_is_blocked(self):
        user, _ = make_seller("p@kb.com", "Pend", SellerProfile.Status.PENDING)
        auth(self.client, user)
        self.assertEqual(self.client.get("/api/seller/dashboard/").status_code, 403)


class ProfileTests(APITestCase):
    def test_pending_seller_can_read_and_edit_phone(self):
        user, _ = make_seller("p@kb.com", "Pend", SellerProfile.Status.PENDING)
        auth(self.client, user)
        self.assertEqual(self.client.get("/api/seller/profile/").data["status"], "pending")
        r = self.client.patch("/api/seller/profile/", {"phone": "01700000000"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["phone"], "01700000000")

    def test_status_and_slug_cannot_be_edited(self):
        user, profile = make_seller("p@kb.com", "Pend", SellerProfile.Status.PENDING)
        auth(self.client, user)
        self.client.patch("/api/seller/profile/", {"status": "approved", "slug": "mine", "shop_name": "Pend 2"})
        profile.refresh_from_db()
        self.assertEqual((profile.status, profile.slug, profile.shop_name), ("pending", "pend", "Pend 2"))

    def test_duplicate_shop_name_is_400(self):
        make_seller("a@kb.com", "Taken")
        user, _ = make_seller("b@kb.com", "Other")
        auth(self.client, user)
        self.assertEqual(self.client.patch("/api/seller/profile/", {"shop_name": "Taken"}).status_code, 400)

    def test_user_without_application_gets_404(self):
        auth(self.client, make_user("c@kb.com"))
        self.assertEqual(self.client.get("/api/seller/profile/").status_code, 404)


class ApplyThrottleTests(APITestCase):
    def test_apply_is_rate_limited(self):
        cache.clear()
        auth(self.client, make_user("a@kb.com"))
        with patch.object(ScopedRateThrottle, "THROTTLE_RATES", {"seller_apply": "2/day"}):
            codes = [self.client.post("/api/seller/apply/", {"shop_name": f"S{i}"}).status_code for i in range(3)]
        self.assertEqual(codes, [201, 400, 429])      # 2nd is a duplicate (400) but still counted
        cache.clear()


class StatusEmailTests(TestCase):
    def test_approved_seller_is_emailed(self):
        user, profile = make_seller("s@kb.com", "Happy")
        self.assertEqual(send_seller_status_email(profile.id), "sent")
        self.assertEqual(mail.outbox[0].to, ["s@kb.com"])
        self.assertIn("approved", mail.outbox[0].subject)

    def test_pending_seller_gets_nothing(self):
        _, profile = make_seller("s@kb.com", "Waiting", SellerProfile.Status.PENDING)
        self.assertEqual(send_seller_status_email(profile.id), "skipped")
        self.assertEqual(mail.outbox, [])

    def test_task_uses_status_at_run_time_not_queue_time(self):
        _, profile = make_seller("s@kb.com", "Flip")             # queued while approved...
        SellerProfile.objects.filter(pk=profile.pk).update(status="suspended")   # ...changed before it runs
        send_seller_status_email(profile.id)
        self.assertIn("suspended", mail.outbox[0].subject)

    def test_missing_profile_is_skipped(self):
        self.assertEqual(send_seller_status_email(99999), "skipped")


class AdminQueuesEmailTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(email="root@kb.com", password="pass1234!")
        _, self.profile = make_seller("s@kb.com", "Queue", SellerProfile.Status.PENDING)
        self.client.force_login(self.admin)

    def bulk(self, action="approve_sellers"):
        return self.client.post("/admin/sellers/sellerprofile/", {
            "action": action, "_selected_action": [self.profile.pk],
        })

    def test_bulk_approve_queues_one_email_after_commit(self):
        with patch("sellers.services.send_seller_status_email") as task:
            with self.captureOnCommitCallbacks(execute=True):
                self.bulk()
        task.delay.assert_called_once_with(self.profile.pk)

    def test_nothing_is_queued_if_the_transaction_never_commits(self):
        with patch("sellers.services.send_seller_status_email") as task:
            self.bulk()                      # callbacks captured but not executed
        task.delay.assert_not_called()

    def test_broker_outage_does_not_break_the_admin_action(self):
        with patch("sellers.services.send_seller_status_email") as task:
            task.delay.side_effect = ConnectionError("redis down")
            with self.assertLogs("sellers.services", level="ERROR") as logs:
                with self.captureOnCommitCallbacks(execute=True):
                    r = self.client.post("/admin/sellers/sellerprofile/", {
                        "action": "approve_sellers", "_selected_action": [self.profile.pk],
                    })
        self.assertEqual(r.status_code, 302)
        self.assertIn("Could not queue status email", logs.output[0])
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.status, "approved")

    def test_editing_status_on_the_detail_page_queues_email(self):
        with patch("sellers.services.send_seller_status_email") as task:
            with self.captureOnCommitCallbacks(execute=True):
                r = self.client.post(f"/admin/sellers/sellerprofile/{self.profile.pk}/change/", {
                    "user": self.profile.user_id, "shop_name": "Queue", "slug": "queue",
                    "phone": "", "status": "suspended",
                })
        self.assertEqual(r.status_code, 302, getattr(r, "context", None) and r.context["adminform"].form.errors)
        task.delay.assert_called_once_with(self.profile.pk)
