# KenaBazaar Authentication API (updated)

Base URL: `/api/`

## Cookie and CSRF setup

The refresh JWT is no longer returned in JSON or stored by frontend JavaScript. Login sets an `HttpOnly` cookie named `kenabazaar_refresh`, scoped to `/api/auth/`. In production it uses `Secure` and `SameSite=None` for a separately hosted frontend. Local development uses `SameSite=Lax` and does not require HTTPS.

Because browsers attach cookies automatically, call `GET /api/auth/csrf/` with Axios `withCredentials: true` before cookie-backed POST requests. The response contains `csrfToken`; send it as `X-CSRFToken` on `/api/auth/refresh/` and `/api/auth/logout/`. Configure `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` with the exact frontend origin(s). Do not use wildcard origins with credentials.

## Endpoints

### `POST /api/auth/register/`

```json
{"email":"customer@example.com","full_name":"Customer","password":"StrongPassword1!","password2":"StrongPassword1!"}
```

Returns `201`; the user must log in afterward.

### `POST /api/auth/login/`

```json
{"email":"customer@example.com","password":"StrongPassword1!"}
```

Returns `{ "access": "..." }` and sets the refresh cookie. The refresh token is intentionally omitted from JSON. Existing guest-cart merging remains part of successful login.

### `GET /api/auth/me/`

Requires `Authorization: Bearer <access>`.

Example response:

```json
{"id":1,"email":"customer@example.com","full_name":"Customer"}
```

### `POST /api/auth/refresh/`

No JSON body required. Requires the refresh cookie and `X-CSRFToken`. Returns `{ "access": "..." }`; refresh rotation updates the HttpOnly cookie. Missing/invalid refresh sessions return `401` and an invalid cookie is cleared.

### `POST /api/auth/logout/`

No JSON body required. Requires `X-CSRFToken`. Blacklists the refresh cookie when valid and clears it. Returns `205`. The frontend should also clear its in-memory access token and Redux auth state.

### `GET /api/auth/csrf/`

Returns `{ "csrfToken": "..." }` and sets Django's CSRF cookie. Use the returned token in `X-CSRFToken` for cookie-backed POST requests.

### `POST /api/auth/password-reset/`

Request body:

```json
{"email":"customer@example.com"}
```

Returns the same generic response whether or not the email exists. The reset email links to the configured `FRONTEND_URL`.

### `POST /api/auth/password-reset/confirm/{uidb64}/{token}/`

Request body:

```json
{"password":"NewStrongPassword1!","password2":"NewStrongPassword1!"}
```

Both passwords must match and pass Django's configured password validators. Invalid/expired reset links return `400`.

## Deployment configuration

Set these environment variables on the backend deployment:

- `CORS_ALLOWED_ORIGINS=https://your-frontend.example`
- `CSRF_TRUSTED_ORIGINS=https://your-frontend.example`
- `FRONTEND_URL=https://your-frontend.example`
- `DJANGO_DEBUG=False`
- `DJANGO_SECRET_KEY=<strong-secret>`

For local development, use the frontend origin actually used by Vite (normally `http://localhost:5173`). Never commit `.env` or production secrets.
