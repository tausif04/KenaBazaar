from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from catalog.models import Product

from .models import SellerProfile
from .testing import auth, make_seller, make_user

User = get_user_model()


class SellerApplyTests(APITestCase):
    def setUp(self):
        from django.core.cache import cache
        cache.clear()   # throttle counters live in the cache

    def test_apply_creates_pending_profile(self):
        user = make_user("a@kb.com")
        auth(self.client, user)
        r = self.client.post("/api/seller/apply/", {"shop_name": "Noor Shop"})
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        profile = SellerProfile.objects.get(user=user)
        self.assertEqual(profile.status, "pending")
        self.assertEqual(profile.slug, "noor-shop")

    def test_client_cannot_self_approve_or_pick_owner(self):
        victim = make_user("v@kb.com")
        user = make_user("a@kb.com")
        auth(self.client, user)
        r = self.client.post("/api/seller/apply/", {
            "shop_name": "Sneaky", "status": "approved", "user": victim.id, "slug": "x",
        })
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        profile = SellerProfile.objects.get(shop_name="Sneaky")
        self.assertEqual(profile.status, "pending")      # status ignored
        self.assertEqual(profile.user_id, user.id)        # owner is the token's user
        self.assertEqual(profile.slug, "sneaky")          # slug ignored

    def test_second_application_is_rejected(self):
        user, _ = make_seller("a@kb.com", "First", SellerProfile.Status.PENDING)
        auth(self.client, user)
        r = self.client.post("/api/seller/apply/", {"shop_name": "Second"})
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_anonymous_cannot_apply(self):
        r = self.client.post("/api/seller/apply/", {"shop_name": "Nope"})
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)


class SellerRoleBoundaryTests(APITestCase):
    url = "/api/seller/products/"

    def test_anonymous_gets_401(self):
        self.assertEqual(self.client.get(self.url).status_code, 401)

    def test_plain_customer_gets_403(self):
        auth(self.client, make_user("c@kb.com"))
        self.assertEqual(self.client.get(self.url).status_code, 403)

    def test_pending_seller_gets_403(self):
        user, _ = make_seller("p@kb.com", "Pending", SellerProfile.Status.PENDING)
        auth(self.client, user)
        self.assertEqual(self.client.get(self.url).status_code, 403)

    def test_approved_seller_gets_200(self):
        user, _ = make_seller("s@kb.com", "Good")
        auth(self.client, user)
        self.assertEqual(self.client.get(self.url).status_code, 200)

    def test_suspension_applies_to_an_already_issued_token(self):
        user, profile = make_seller("s@kb.com", "Good")
        auth(self.client, user)                     # token issued while approved
        self.assertEqual(self.client.get(self.url).status_code, 200)
        profile.status = SellerProfile.Status.SUSPENDED
        profile.save()
        self.assertEqual(self.client.get(self.url).status_code, 403)


class SellerOwnershipTests(APITestCase):
    def setUp(self):
        self.user_a, self.shop_a = make_seller("a@kb.com", "Shop A")
        self.user_b, self.shop_b = make_seller("b@kb.com", "Shop B")
        self.mine = Product.objects.create(name="Mine", regular_price=10, seller=self.shop_a)
        self.hidden = Product.objects.create(
            name="Mine inactive", regular_price=10, seller=self.shop_a, is_active=False)
        self.theirs = Product.objects.create(name="Theirs", regular_price=10, seller=self.shop_b)
        auth(self.client, self.user_a)

    def test_list_contains_only_own_products_including_inactive(self):
        r = self.client.get("/api/seller/products/")
        names = {p["name"] for p in r.data["results"]}
        self.assertEqual(names, {"Mine", "Mine inactive"})

    def test_own_product_detail_is_visible(self):
        self.assertEqual(self.client.get(f"/api/seller/products/{self.mine.id}/").status_code, 200)

    def test_other_sellers_product_is_404_not_403(self):
        r = self.client.get(f"/api/seller/products/{self.theirs.id}/")
        self.assertEqual(r.status_code, 404)        # existence is not leaked

    def test_other_sellers_product_cannot_be_modified(self):
        r = self.client.patch(f"/api/seller/products/{self.theirs.id}/", {"name": "Hacked"})
        self.assertEqual(r.status_code, 404)
        self.theirs.refresh_from_db()
        self.assertEqual(self.theirs.name, "Theirs")


class PublicCatalogIsReadOnlyTests(APITestCase):
    def setUp(self):
        _, shop = make_seller("a@kb.com", "Shop A")
        self.product = Product.objects.create(name="Abaya", regular_price=10, seller=shop)

    def test_anyone_can_read(self):
        self.assertEqual(self.client.get("/api/products/").status_code, 200)

    def test_customer_cannot_write(self):
        auth(self.client, make_user("c@kb.com"))
        self.assertEqual(self.client.post("/api/products/", {"name": "x"}).status_code, 405)
        self.assertEqual(self.client.delete(f"/api/products/{self.product.id}/").status_code, 405)
        self.assertTrue(Product.objects.filter(pk=self.product.pk).exists())

    def test_even_staff_cannot_write_through_public_api(self):
        staff = User.objects.create_user(email="st@kb.com", password="pass1234!", is_staff=True)
        auth(self.client, staff)
        self.assertEqual(self.client.post("/api/products/", {"name": "x"}).status_code, 405)


class CurrentUserSellerFieldTests(APITestCase):
    def test_customer_has_null_seller(self):
        auth(self.client, make_user("c@kb.com"))
        self.assertIsNone(self.client.get("/api/auth/me/").data["seller"])

    def test_seller_status_is_exposed(self):
        user, _ = make_seller("p@kb.com", "Pending Shop", SellerProfile.Status.PENDING)
        auth(self.client, user)
        seller = self.client.get("/api/auth/me/").data["seller"]
        self.assertEqual(seller["status"], "pending")
        self.assertEqual(seller["shop_name"], "Pending Shop")


class AdminBulkActionTests(APITestCase):
    def test_admin_can_bulk_approve(self):
        admin = User.objects.create_superuser(email="root@kb.com", password="pass1234!")
        _, s1 = make_seller("a@kb.com", "A", SellerProfile.Status.PENDING)
        _, s2 = make_seller("b@kb.com", "B", SellerProfile.Status.PENDING)
        self.client.force_login(admin)
        r = self.client.post("/admin/sellers/sellerprofile/", {
            "action": "approve_sellers", "_selected_action": [s1.pk, s2.pk],
        })
        self.assertEqual(r.status_code, 302)
        self.assertEqual(SellerProfile.objects.filter(status="approved").count(), 2)
