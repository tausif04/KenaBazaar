# KenaBazaar

A production-oriented full-stack e-commerce backend built with **Django, Django REST Framework, PostgreSQL, Docker, Cloudinary, Stripe, Redis, and Celery**.

KenaBazaar was built from scratch to demonstrate practical backend engineering concepts including relational database design, REST API development, authentication, cart management, order processing, payment integration, asynchronous tasks, image storage, security, containerization, and cloud deployment.

## Live API

**Production API:**  
https://kenabazaar.onrender.com


---

## Table of Contents

- [Problem It Solves](#problem-it-solves)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Core Features](#core-features)
- [Key Technical Decisions](#key-technical-decisions)
- [API Capabilities](#api-capabilities)
- [Media Storage](#media-storage)
- [Authentication](#authentication)
- [Payment Flow](#payment-flow)
- [Background Tasks](#background-tasks)
- [Docker Setup](#docker-setup)
- [Production Deployment](#production-deployment)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development Workflow](#development-workflow)
- [Future Improvements](#future-improvements)

---

## Problem It Solves

KenaBazaar is designed as more than a basic CRUD e-commerce application.

The project focuses on the backend engineering problems that appear in real-world applications:

- Designing a normalized relational database schema
- Managing guest and authenticated-user carts
- Preventing product price changes from modifying historical orders
- Handling product variants and stock independently
- Building secure REST APIs
- Implementing JWT-based authentication
- Integrating third-party payment providers
- Verifying payments using server-to-server webhooks
- Handling asynchronous operations with Celery
- Storing uploaded media outside the application server
- Avoiding N+1 database queries
- Containerizing the application with Docker
- Deploying a Django application with PostgreSQL to the cloud
- Managing secrets through environment variables

The goal is to build a backend that can be explained and defended from both a **software design** and **implementation** perspective.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Language | Python |
| Backend | Django |
| API | Django REST Framework |
| Authentication | Django Authentication + JWT |
| Database | PostgreSQL |
| Database Configuration | `dj-database-url` |
| Image Storage | Cloudinary |
| Static Files | WhiteNoise |
| Payments | Stripe |
| Async Tasks | Celery |
| Message Broker | Redis |
| Containerization | Docker |
| Web Server | Gunicorn |
| Deployment | Render |
| Version Control | Git / GitHub |
| API Documentation | drf-spectacular |
| Filtering | django-filter |

---

## Architecture

KenaBazaar follows a modular Django architecture with separate applications for major business domains.

### High-Level Architecture

```text
                    ┌─────────────────────┐
                    │      Client         │
                    │ Browser / Frontend  │
                    └──────────┬──────────┘
                               │
                               │ HTTP / REST
                               ▼
                    ┌─────────────────────┐
                    │       Render        │
                    │                     │
                    │ Django + DRF        │
                    │ Gunicorn             │
                    └──────┬──────┬───────┘
                           │      │
              ┌────────────┘      └──────────────┐
              ▼                                   ▼
     ┌─────────────────┐                 ┌─────────────────┐
     │   PostgreSQL    │                 │    Cloudinary   │
     │                 │                 │                 │
     │ Users           │                 │ Product Images  │
     │ Products        │                 │ Media Storage   │
     │ Cart            │                 └─────────────────┘
     │ Orders          │
     │ Payments        │
     └─────────────────┘
              │
              │
              ▼
     ┌─────────────────┐
     │ Redis + Celery  │
     │                 │
     │ Async Tasks     │
     │ Email Jobs      │
     └─────────────────┘

              ┌─────────────────┐
              │     Stripe      │
              │                 │
              │ Payment +       │
              │ Webhooks        │
              └─────────────────┘
