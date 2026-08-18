# Smart Cash & Carry — Sprint 1 Starter

This repository provides the minimal technical foundation for the Smart Cash & Carry grocery delivery MVP in Noorkot, Punjab, Pakistan. It includes a React and Tailwind frontend, an Express REST API, and a PostgreSQL database, orchestrated with Docker Compose. Sprint 1 deliberately excludes product browsing, cart, checkout, authentication flows, and administration screens.

## Included services

| Service | Directory | Responsibility | Default host port |
| --- | --- | --- | --- |
| Frontend | `frontend/` | Vite-powered React page that requests and shows API health | `5173` |
| Backend | `backend/` | Express REST API exposing `GET /api/health` | `4000` |
| Database | `database/` | PostgreSQL initialization schema with no seed records | `5432` |

## Quick start

Copy the environment template, replace the PostgreSQL password placeholder with a strong local password, and start all services in detached mode.

```bash
cp .env.example .env
# Edit .env and set POSTGRES_PASSWORD to a strong local value.
docker compose up -d
```

The frontend is then available at `http://localhost:<FRONTEND_PORT>`, which is `http://localhost:5173` when using the example values. The page requests `/api/health` through the Vite development proxy and displays the JSON response returned by the Express backend.

## Verification

Use the following commands to confirm that the containers are running and that the API is reachable. Replace the placeholder port values if you changed them in `.env`.

```bash
docker compose ps
curl http://localhost:4000/api/health
```

The API response is:

```json
{ "status": "ok" }
```

To inspect the empty schema after startup, connect to the database container with the database and user values stored in `.env`.

```bash
docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

The initialization script only creates tables and relationships. It does not insert product, category, order, order item, or administrator records. PostgreSQL initialization scripts run only when the named database volume is first created. To recreate the empty schema during local development, stop the stack and remove the local volume before starting again.

```bash
docker compose down -v
docker compose up -d
```

## Project structure

```text
.
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express application and health route
│   │   ├── config.js              # Required environment validation
│   │   ├── database.js            # PostgreSQL connection helper
│   │   └── server.js              # Server startup and DB connectivity check
│   ├── test/health.test.js        # Health endpoint test
│   ├── Dockerfile
│   └── package.json
├── database/init.sql              # Empty PostgreSQL schema
├── frontend/
│   ├── src/                       # React components and Tailwind styles
│   ├── Dockerfile
│   ├── vite.config.js             # API proxy configuration
│   └── package.json
├── .env.example                   # Required local configuration template
├── .gitignore
├── docker-compose.yml
└── README.md
```

## Database schema

| Table | Purpose | Relationships |
| --- | --- | --- |
| `Category` | Product categorization | Referenced by `Product.category_id` |
| `Product` | Future grocery catalog records | Belongs to `Category` |
| `Order` | Future delivery order records | Referenced by `OrderItem.order_id` |
| `OrderItem` | Immutable line-item snapshots for an order | Belongs to `Order` and references `Product` |
| `Admin` | Future administrative account credentials | No foreign-key relationship in Sprint 1 |

The SQL uses quoted PascalCase table names so the deployed table identifiers precisely match the requested names: `Category`, `Product`, `Order`, `OrderItem`, and `Admin`.

## Local development and tests

The services can also run without Docker if PostgreSQL is available and the equivalent environment variables are set. The standard container workflow is recommended for consistent local networking.

```bash
cd backend
npm install
npm test
```

## GitHub readiness

The repository is ready to be initialized and pushed to GitHub. Sensitive `.env` files and dependency/build directories are ignored, while `.env.example` remains tracked as the safe configuration template.

```bash
git init
git add .
git commit -m "chore: initialize Smart Cash & Carry Sprint 1"
git branch -M main
git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
git push -u origin main
```

