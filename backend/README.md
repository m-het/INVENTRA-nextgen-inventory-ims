# IMS Backend – Inventory Management System

Node.js + Express + PostgreSQL backend for the Inventory Management System (IMS). Role-based access for **Inventory Managers** and **Warehouse Staff**.

## Prerequisites

- Node.js (LTS)
- PostgreSQL installed and running on your machine

**If you just installed PostgreSQL:** open `.env` and set `DATABASE_URL` with the **password you chose for the `postgres` user** (replace `YOUR_PASSWORD` or `postgres` in the URL). Then run `npm run db:setup`.

## Setup (local PostgreSQL)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   - Copy `.env.example` to `.env`.
   - Set `DATABASE_URL` with your **PostgreSQL username and password** (e.g. the password you set when installing PostgreSQL). Default user is usually `postgres`:
   - Example: `DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ims_db"`

3. **Create database, run migrations, and seed (one command)**
   ```bash
   npm run db:setup
   ```
   This will: create the `ims_db` database if it doesn’t exist, run Prisma migrations, and seed demo data.

   Or run step by step:
   ```bash
   npm run db:create    # create ims_db if missing
   npm run db:migrate   # create tables
   npm run db:seed      # optional: demo users and data
   ```

4. **Demo users (after seed)**
   - `manager@ims.test` / `staff@ims.test` — password: `password123`
   - Plus sample categories, products, warehouse, supplier, and a draft PO.

## Run

- Development: `npm run dev` (nodemon)
- Production: `npm start`

Server runs at `http://localhost:3000` by default.

## API Base

All API routes are under **`/api/v1`**.

### Auth (no JWT required for login/register/reset)

- `POST /api/v1/auth/register` – body: `{ email, password, name?, role? }`
- `POST /api/v1/auth/login` – body: `{ email, password }` → returns `{ user, accessToken, refreshToken }` (redirect to dashboard with token)
- `POST /api/v1/auth/forgot-password` – body: `{ email }` → sends OTP (in development returns `otpForDev` in response)
- `POST /api/v1/auth/reset-password` – body: `{ email, otp, newPassword }` → resets password
- `POST /api/v1/auth/refresh` – body: `{ refreshToken }`
- `POST /api/v1/auth/logout` – optional body: `{ refreshToken }` (requires JWT)

Use the returned `accessToken` in the `Authorization: Bearer <token>` header for all other routes.

### Roles & permissions

- **INVENTORY_MANAGER**: Full access (catalog, stock, movements, GRN, pick lists, stock count, suppliers, POs, dashboard, reports, audit logs).
- **WAREHOUSE_STAFF**: View catalog and stock; create/update GRN, pick lines, stock count lines; view own pick lists/counts. Cannot delete products, manage POs, access reports/audit.

### Main endpoints

| Area | Examples |
|------|----------|
| Users | `GET /users/me`, `PATCH /users/me`, `GET /users` (manager), `PATCH /users/:id` (manager) |
| Catalog | CRUD ` /categories`, `/products`; `GET /products/by-sku/:sku`, `GET /products/by-barcode/:code` |
| Warehouses | CRUD `/warehouses`, `GET/POST /warehouses/:id/bins` |
| Stock | `GET /stock/levels` (query: productId, locationId) |
| Movements | `POST /movements`, `GET /movements` (type, productId, locationId, warehouseId, categoryId, fromDate, toDate) |
| Suppliers | CRUD `/suppliers` |
| Purchase orders | CRUD `/purchase-orders`, `POST /purchase-orders/:id/lines` |
| GRN | `GET/POST /grn`, `GET /grn/:id`, `PATCH /grn/:id/lines/:lineId`, `POST /grn/:id/lines/:lineId/shelve`, `POST /grn/:id/confirm` |
| Pick lists | CRUD `/pick-lists`, `PATCH /pick-lists/:id/lines/:lineId/pick`, `POST /pick-lists/:id/dispatch` |
| Stock count | `GET/POST /stock-counts`, `POST /stock-counts/:id/lines`, `PATCH /stock-counts/:id/lines`, `POST /stock-counts/:id/complete` |
| Dashboard | `GET /dashboard/kpis`, `GET /dashboard/alerts`, `GET /dashboard/documents` (filters below) |
| Reports | `GET /reports/turnover`, `GET /reports/dead-stock`, `GET /reports/demand-trends` (manager) |
| Audit | `GET /audit-logs` (manager, query: userId, entityType, fromDate, toDate) |
| Integrations | `POST /integrations/webhook/:provider` (manager) |

### Dashboard KPIs (`GET /dashboard/kpis`)

- **totalProducts** – number of product SKUs  
- **totalProductsInStock** – sum of quantities across all locations  
- **lowStockCount** – products at or below reorder level  
- **outOfStockCount** – products with reorder level set and zero quantity  
- **pendingReceipts** – GRNs in DRAFT  
- **pendingDeliveries** – pick lists PENDING or IN_PROGRESS  
- **internalTransfersScheduled** – count of TRANSFER movements in last 7 days  
- **totalWarehouses**, **movementsToday**

### Dynamic filters (`GET /dashboard/documents`)

- **documentType**: `Receipts` | `Delivery` | `Internal` | `Adjustments`  
- **status**: `Draft` | `Waiting` | `Ready` | `Done` | `Canceled`  
- **warehouseId**: filter by warehouse/location  
- **categoryId**: filter by product category  
- **limit**, **offset**: pagination  

Returns a unified list of documents (GRNs, pick lists, stock movements) for the dashboard view.

### Health

- `GET /health` – returns `{ status: 'ok', timestamp }`

## Integrations

- **Webhook**: `POST /api/v1/integrations/webhook/:provider` with JSON body. For ERP/accounting/e-commerce, call this endpoint and store provider-specific config (e.g. API keys) via your own admin flow or env.
