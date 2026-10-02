import os
from Backend.KenaBazaar.celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "KenaBazaar.settings")

app = Celery("KenaBazaar")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()