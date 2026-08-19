# Smart Cash & Carry — Sprint 2 Admin Foundation

This repository contains the technical foundation for the Smart Cash & Carry grocery delivery MVP in Noorkot, Punjab, Pakistan. Sprint 2 adds a protected administrator workspace for category and product setup. It still does **not** include the customer catalog, product search, cart, checkout, customer accounts, or order operations; those remain deferred to later sprints.

## Services

| Service | Directory | Responsibility | Default host port |
| --- | --- | --- | --- |
| Frontend | `frontend/` | React and Tailwind administrator login and product-management interface | `5173` |
| Backend | `backend/` | Express REST API, admin authentication, category/product routes, image uploads | `4000` |
| Database | `database/` | PostgreSQL schema and first-run initialization script | `5432` |

## Local startup

Copy the environment template to `.env`, replace every placeholder with appropriate local values, and start the three services.

```bash
cp .env.example .env
docker compose up -d
```

The frontend is available at `http://localhost:<FRONTEND_PORT>`, normally `http://localhost:5173`. Visit that URL to use the admin login screen. The backend is available at `http://localhost:<BACKEND_PORT>`, normally `http://localhost:4000`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `POSTGRES_DB` | Name of the local PostgreSQL database. |
| `POSTGRES_USER` | PostgreSQL application user. |
| `POSTGRES_PASSWORD` | Strong local PostgreSQL password. |
| `POSTGRES_PORT` | Host port mapped to PostgreSQL. |
| `DB_HOST` / `DB_PORT` | Internal database service address used by the backend. |
| `BACKEND_HOST` / `BACKEND_PORT` | Internal host name and public port for Express. |
| `FRONTEND_PORT` | Public Vite development-server port. |
| `ADMIN_USERNAME` | Username used only to create the first administrator row. |
| `ADMIN_PASSWORD` | Plain administrator password used only at initial seeding; it is bcrypt-hashed before storage and is never returned or logged. |
| `JWT_SECRET` | Long random secret used to sign administrator access tokens. |

The backend seeds the first `Admin` record only when the table has no rows. After that, changing `ADMIN_USERNAME` or `ADMIN_PASSWORD` does **not** replace an existing administrator account.

> Keep `.env` private. Do not commit real database passwords, administrator passwords, or JWT secrets.

## Administrator workflow

The React application redirects visitors without a saved administrator token to `/login`. A successful login stores the token in session storage and redirects to `/admin`. The dashboard permits category creation, product creation and editing, availability toggling, and product deletion.

Product imagery has two modes. Administrators can paste an external `image_url`, or upload an image file up to 5 MB. Uploaded files are stored in the named Docker volume `product_uploads`, served by the backend under `/uploads/<generated-file-name>`, and excluded from Git tracking.

## REST API

`POST /api/admin/login` is public. Every remaining `/api/admin/*` route requires an `Authorization: Bearer <token>` header.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Returns `{ "status": "ok" }`. |
| `POST` | `/api/admin/login` | Validates administrator credentials and returns a JWT token. |
| `GET` | `/api/admin/categories` | Lists categories. |
| `POST` | `/api/admin/categories` | Creates a category with `name`. |
| `GET` | `/api/admin/products` | Lists products with category names. |
| `POST` | `/api/admin/products` | Creates a product with `name`, `price`, `category_id`, `image_url`, and `available`. |
| `PUT` | `/api/admin/products/:id` | Updates a product. |
| `DELETE` | `/api/admin/products/:id` | Deletes a product. |
| `PATCH` | `/api/admin/products/:id/availability` | Updates only the `available` flag. |
| `POST` | `/api/admin/uploads` | Accepts multipart field `image` and returns an uploaded `image_url`. |

## Database tables

| Table | Sprint 2 use |
| --- | --- |
| `Category` | Administrator-managed category records for product assignment. |
| `Product` | Administrator-managed product records with price, availability, category, and optional image URL. |
| `Order` / `OrderItem` | Retained empty for a later ordering sprint. |
| `Admin` | Holds the one-time seeded administrator username and bcrypt password hash. |

## Tests and source validation

Run backend tests from the backend directory and compile the frontend from the frontend directory.

```bash
cd backend
npm install
npm test

cd ../frontend
npm install
VITE_API_PROXY_TARGET=http://backend:4000 npm run build
```

The backend suite includes health-route coverage and Sprint 2 tests for admin seeding, bcrypt hashing, login, token protection, category creation, and product creation. Docker Compose must still be run on a Docker-enabled machine to validate the live PostgreSQL container, file volume, frontend proxy, and browser workflow end to end.

## Project structure

```text
.
├── backend/
│   ├── src/
│   │   ├── adminRoutes.js
│   │   ├── auth.js
│   │   ├── seedAdmin.js
│   │   └── server.js
│   └── test/
├── database/
│   └── init.sql
├── frontend/
│   └── src/
│       ├── components/
│       ├── api.js
│       └── App.jsx
├── .env.example
├── docker-compose.yml
└── README.md
```

