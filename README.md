# KenaBazaar

A full-stack e-commerce web application built with Django, modeled on real-world stores— product catalog, cart, checkout, accounts, and admin — built from scratch as a resume-grade backend engineering project.


---

## Table of Contents

- [Problem It Solves](#problem-it-solves)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Core Features](#core-features)
- [Key Technical Decisions](#key-technical-decisions)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Build Log / Progress](#build-log--progress)
- [Roadmap / Stretch Goals](#roadmap--stretch-goals)

---

## Problem It Solves

Building **"an online store"** isn't the hard part — Shopify, WooCommerce, and a dozen tutorials do that in an afternoon. What those approaches skip is exactly what backend interviews probe:

- **A tutorial cart** usually stores items in `localStorage` or a flat session dict with no thought given to what happens when a logged-in user's cart needs to merge with their guest session, or why a DB write per click is wasteful.
- **A WordPress/WooCommerce site** (like [eshopdhaka.com](https://eshopdhaka.com), the reference for this project) gets you a working storefront with zero schema design of your own — the data model, query patterns, and security decisions are all inherited, not made.
- **Most copy-pasted Django e-commerce tutorials** skip the parts that actually break in production: price changes after checkout, N+1 queries on the product list, trusting a browser redirect instead of a signed payment webhook.

**KenaBazaar** exists to force those decisions to be made and defended, not inherited:

- A schema designed from first principles — not "every field is a `CharField`".
- Session-vs-database cart tradeoffs made deliberately, not defaulted into.
- A payment flow that trusts server-to-server webhooks over client redirects, because the browser's word about "payment succeeded" can't be trusted.
- A codebase clean enough to defend line-by-line in a technical interview — not just code that runs.

  
## Tech Stack

| Layer | Choice |
| --- | --- |
| Backend | Django (Python) |
| Database | PostgreSQL |
| Frontend | Django templates + Bootstrap/Tailwind (v1); React possible as a v2 stretch goal |
| Payments | Stripe (test mode), or SSLCommerz sandbox for a Bangladesh-specific flow |
| Caching / Async | Redis + Celery (order confirmation emails, cart caching) |
| Deployment | Docker + Render/Railway/Fly.io |
| Version Control | Git/GitHub, feature-branch workflow |

## Architecture

Full diagrams — system architecture, ERD, use cases, sequence flows, and deployment topology — live in [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md).

At a high level:

- Django serves both the storefront templates and the admin.
- PostgreSQL is the system of record for products, orders, and users.
- Redis backs Celery for async work (emails) and optional cart/session caching.
- Stripe is integrated via Checkout Sessions, with payment confirmation driven by a signed webhook rather than the browser redirect.

## Core Features

1. **Product catalog** — categories, variants (size/color), search, filter, sort, pagination
2. **Cart** — session-based for guests, database-backed for logged-in users, sharing a single `Cart` model
3. **User accounts** — registration, login, password reset, order history (email-based auth via Django's built-in `AbstractUser`)
4. **Checkout** — order creation, price snapshotting, Stripe payment integration with webhook-verified confirmation
5. **Admin dashboard** — inventory management via a customized Django admin (list filters, inline variant editing)
6. **Performance & security basics** — N+1 query fixes via `select_related`/`prefetch_related`, CSRF/XSS protection, environment-based secrets, `DEBUG=False` in production

## Key Technical Decisions

These are the design choices most worth defending in an interview — the reasoning behind each lives in `DECISIONS.md`, dated as they were made.

| Decision | Why |
| --- | --- |
| `Cart.user` is nullable, with a `session_key` field | Guest carts (session-based) and logged-in carts (DB-backed) share one table instead of two parallel systems. |
| `CartItem` references `ProductVariant` live | The cart should always reflect current price/stock — if either changes, the cart reflects that before checkout. |
| `OrderItem.price_at_purchase` is its own column, not a live lookup | Once paid, an order must never change even if the product's price changes later — price snapshotting. |
| Stock/SKU live on `ProductVariant`, not `Product` | A shirt in size M and size L are different sellable units with independent stock — this drove a ForeignKey-based variant model instead of flat fields on `Product`. |
| Payment is confirmed via Stripe webhook, not the browser redirect | The browser redirect can be faked or the tab closed early; the webhook is a signed server-to-server call, so it's the only step that can actually be trusted. |
| Order emails are sent via Celery, not inline | A slow email provider shouldn't be able to hang the checkout request. |

## Getting Started

> This section will be filled in as the environment and Docker setup are finalized (Day 0 / Day 7 of the build plan).

```bash
# Clone the repo
git clone <repo-url>
cd kenabazaar

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env       # fill in SECRET_KEY, DB credentials, Stripe keys, etc.

# Run migrations and start the dev server
python manage.py migrate
python manage.py runserver



