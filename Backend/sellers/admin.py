from django.contrib import admin, messages

from .models import SellerProfile
from .services import queue_status_email


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = ("shop_name", "user", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("shop_name", "user__email")   # also powers the Product seller picker
    list_select_related = ("user",)  # avoids one user query per row (N+1)
    actions = ["approve_sellers", "suspend_sellers"]

    def _bulk_set(self, request, queryset, new_status, label, level):
        ids = list(queryset.values_list("pk", flat=True))
        count = queryset.update(status=new_status)
        for pk in ids:
            queue_status_email(pk)
        self.message_user(request, f"{count} seller(s) {label}.", level)

    @admin.action(description="Approve selected sellers")
    def approve_sellers(self, request, queryset):
        self._bulk_set(request, queryset, SellerProfile.Status.APPROVED, "approved", messages.SUCCESS)

    @admin.action(description="Suspend selected sellers")
    def suspend_sellers(self, request, queryset):
        self._bulk_set(request, queryset, SellerProfile.Status.SUSPENDED, "suspended", messages.WARNING)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if change and "status" in form.changed_data:      # edited by hand on the detail page
            queue_status_email(obj.pk)
