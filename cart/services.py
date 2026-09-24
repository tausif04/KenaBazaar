from .models import Cart


class CartService:
    @staticmethod
    def get_cart(request):
        if request.user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=request.user)
            return cart

        if not request.session.session_key:
            request.session.create()  # forces a session_key to exist even with no prior session
        cart, _ = Cart.objects.get_or_create(session_key=request.session.session_key)
        return cart

    @staticmethod
    def merge_guest_cart_into_user(request, user):
        if not request.session.session_key:
            return
        guest_cart = Cart.objects.filter(session_key=request.session.session_key, user__isnull=True).first()
        if not guest_cart:
            return
        user_cart, _ = Cart.objects.get_or_create(user=user)
        for item in guest_cart.items.all():
            existing = user_cart.items.filter(variant=item.variant).first()
            if existing:
                existing.quantity += item.quantity
                existing.save()
            else:
                item.cart = user_cart
                item.save()
        guest_cart.delete()