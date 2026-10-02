FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN pip install pipenv

COPY Pipfile Pipfile.lock ./

RUN pipenv install --system --deploy

COPY . .

CMD ["sh", "-c", "python manage.py collectstatic --noinput && python manage.py migrate && python manage.py ensure_superuser && gunicorn KenaBazaar.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]