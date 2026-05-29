# ShopManager — Multi-Tenant SaaS POS & Inventory System

A complete, production-ready SaaS-based point-of-sale (POS) and inventory management system for grocery stores, pharmacies, and retail businesses. Built with **Node.js (Express) + Prisma + MySQL** backend and **React + Tailwind CSS** frontend.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Default Credentials](#default-credentials)
- [User Roles & Permissions](#user-roles--permissions)
- [Subscription Plans](#subscription-plans)
- [Complete API Reference](#complete-api-reference)
- [Payment Flow Guide](#payment-flow-guide)
- [User Guide](#user-guide)
- [Development Guide](#development-guide)
- [Deployment](#deployment)

---

## Overview

ShopManager is a multi-tenant SaaS application. Each **store** (tenant) gets its own isolated environment within a shared database. A **Super Admin** manages all tenants from a central dashboard. Each store can have multiple users (Owner, Manager, Employee) with role-based access.

### Key Features

| Module | Features |
|--------|----------|
| **POS & Sales** | Barcode scanning, invoice PDF generation, multiple payment methods, discounts, customer loyalty points, due tracking |
| **Inventory** | Product catalog, categories, barcode generation (EAN13/Code128/QR), stock tracking, low-stock alerts, batch/expiry tracking |
| **Purchases** | Purchase orders, supplier management, automatic stock updates on receipt |
| **Financial** | Expense tracking, profit/loss reports, payment management, sales/purchase reports |
| **Pharmacy** | Prescription handling, controlled substance tracking, batch/expiry management |
| **SaaS Admin** | Tenant management, subscription plans, manual payment (bKash/Bank), usage limits, backup/restore |
| **Real-time** | WebSocket notifications, activity logging, live dashboards |

---

## Tech Stack

### Backend (`backend/`)
| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js 4.18 |
| Database | MySQL 8.0 |
| ORM | Prisma 6.19 |
| Auth | JWT (access + refresh tokens) |
| Validation | Joi 17 |
| Payments | Manual (bKash, Bank Transfer via DB) |
| Realtime | Socket.IO |
| PDF | PDFKit |
| Images | Sharp |
| Logging | Winston |
| Scheduling | node-cron |

### Frontend (`frontend/`)
| Component | Technology |
|-----------|-----------|
| Framework | React 18 |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| Charts | Chart.js + react-chartjs-2 |
| HTTP | Axios (with token refresh interceptor) |

### Infrastructure
| Component | Technology |
|-----------|-----------|
| Containers | Docker + Docker Compose |
| Web Server | Nginx |
| DB Admin | phpMyAdmin |

---

## Architecture

### Data Model (19 Tables)

```
stores ──┬── users
         ├── categories ── products ──┬── sale_items
         ├── customers ───────────────┤── sales
         ├── suppliers ───────────────┤── purchases ── purchase_items
         ├── expenses
         ├── payments
         ├── activity_logs
         ├── notifications
         ├── subscriptions ──┬── subscription_plans
         │                    └── manual_payments
         └── backups
```

### Request Lifecycle

```
Client → Express → Rate Limiter → Helmet → CORS → Morgan →
  authenticate (JWT) → authorize (role) → validate (Joi) →
    Controller → Service → Prisma → MySQL
      → Response helpers → Client
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0
- npm

### 1. Clone & Install

```bash
git clone <repo-url> shopmanager
cd shopmanager

# Backend
cd backend
cp .env.example .env   # edit database credentials
npm install
npx prisma migrate deploy
npm run seed
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

### 2. Access
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:5000/api |
| phpMyAdmin | http://localhost:8080 (via Docker) |

### Docker (All-in-One)

```bash
docker-compose -f docker/docker-compose.yml up -d
```

---

## Environment Variables

Key variables in `backend/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `5000` | API server port |
| `DATABASE_URL` | `mysql://user:pass@localhost:3306/pos` | Prisma connection string |
| `DB_HOST` | `localhost` | MySQL host (for backups) |
| `DB_PORT` | `3306` | MySQL port |
| `DB_NAME` | `pos` | Database name |
| `DB_USER` | `root` | Database user |
| `DB_PASSWORD` | — | Database password |
| `JWT_SECRET` | — | JWT signing key |
| `JWT_REFRESH_SECRET` | — | Refresh token key |
| `JWT_EXPIRES_IN` | `15m` | Access token expiry |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token expiry |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `UPLOAD_DIR` | `uploads` | File upload directory |
| `MAX_FILE_SIZE` | `5242880` | Max upload size (5MB) |
| `SMTP_HOST` | — | Email server host |
| `SMTP_PORT` | `587` | Email server port |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `DEFAULT_TRIAL_DAYS` | `14` | Free trial duration |
| `PLAN_FREE_MAX_PRODUCTS` | `100` | Free plan product limit |
| `PLAN_FREE_MAX_STAFF` | `2` | Free plan staff limit |
| `PLAN_BASIC_MAX_PRODUCTS` | `1000` | Basic plan product limit |
| `PLAN_BASIC_MAX_STAFF` | `10` | Basic plan staff limit |
| `PLAN_PRO_MAX_PRODUCTS` | `10000` | Pro plan product limit |
| `PLAN_PRO_MAX_STAFF` | `50` | Pro plan staff limit |

---

## Default Credentials

After running `npm run seed`:

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | `admin@shopmanager.com` | `admin123456` |
| Store Owner | Created via Admin panel | `tenant` (default) |

---

## User Roles & Permissions

| Role | Scope | Capabilities |
|------|-------|-------------|
| **super_admin** | Global | Manage all tenants, view system stats, approve payments, configure gateways |
| **store_owner** | Own store | Full access: manage products, sales, purchases, users, reports, subscription |
| **manager** | Own store | Products, sales, purchases, customers, reports (no user/subscription mgmt) |
| **employee** | Own store | POS, limited product/customer access (configurable via permissions) |

---

## Subscription Plans

Seeded plans (configurable via super admin):

| Plan | Price/mo | Price/yr | Products | Staff | Features |
|------|----------|----------|----------|-------|----------|
| **Free** | $0 | $0 | 100 | 2 | Basic reporting, POS, customers |
| **Basic** | $29.99 | $299.99 | 1,000 | 10 | + Inventory, suppliers, purchases, expenses, email notifications |
| **Pro** | $79.99 | $799.99 | 10,000 | 50 | + Pharmacy, prescriptions, barcode printing, API, multi-warehouse, priority support |

---

## Complete API Reference

All **110+ routes** are documented below. Except where noted, all endpoints require `Authorization: Bearer <token>` header.

### Authentication — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register a new store & owner |
| POST | `/api/auth/login` | No | Login, returns access + refresh tokens |
| POST | `/api/auth/refresh` | No | Exchange refresh token for new tokens |
| POST | `/api/auth/logout` | Yes | Invalidate refresh token |
| GET | `/api/auth/me` | Yes | Get current user profile |
| PUT | `/api/auth/change-password` | Yes | Change password (requires current) |
| PUT | `/api/auth/profile` | Yes | Update name, phone |

### Stores — `/api/stores`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stores` | Get own store info (with subscription) |
| GET | `/api/stores/current` | Same as above |
| PUT | `/api/stores` | Update store details |
| GET | `/api/stores/settings` | Get store settings |
| PUT | `/api/stores/settings` | Update store settings (logo, currency, etc.) |
| GET | `/api/stores/limits` | Check current product/staff usage vs limits |

### Users — `/api/users`

| Method | Path | Role Required | Description |
|--------|------|---------------|-------------|
| GET | `/api/users` | Any | List store users |
| GET | `/api/users/:id` | Any | Get user details |
| POST | `/api/users` | owner/manager | Create user (staff) |
| PUT | `/api/users/:id` | owner | Update user |
| DELETE | `/api/users/:id` | owner | Delete user |

### Categories — `/api/categories`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/categories` | List categories (paginated) |
| GET | `/api/categories/all` | List all categories (no pagination) |
| GET | `/api/categories/:id` | Get category with product count |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category (reassigns children) |

### Products — `/api/products`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products` | List products (paginated, searchable) |
| GET | `/api/products/barcode/:barcode` | Lookup product by barcode |
| GET | `/api/products/:id` | Get product details |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product (blocks if in use) |
| PATCH | `/api/products/:id/stock` | Adjust stock quantity |
| POST | `/api/products/bulk-update` | Bulk update products (prices, stock) |

### Customers — `/api/customers`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/customers` | List customers (paginated, searchable) |
| GET | `/api/customers/:id` | Get customer details with sales |
| POST | `/api/customers` | Create customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |

### Suppliers — `/api/suppliers`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/suppliers` | List suppliers (paginated, searchable) |
| GET | `/api/suppliers/:id` | Get supplier details with purchases |
| POST | `/api/suppliers` | Create supplier |
| PUT | `/api/suppliers/:id` | Update supplier |
| DELETE | `/api/suppliers/:id` | Delete supplier |

### Sales — `/api/sales`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sales` | List sales (paginated, filterable) |
| GET | `/api/sales/:id` | Get sale with items, payments |
| POST | `/api/sales` | Create sale (with items, auto-stock deduction) |
| PUT | `/api/sales/:id` | Update sale |
| DELETE | `/api/sales/:id` | Cancel sale (restores stock, reverts customer balance) |

### Purchases — `/api/purchases`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/purchases` | List purchases (paginated) |
| GET | `/api/purchases/:id` | Get purchase with items |
| POST | `/api/purchases` | Create purchase order |
| PUT | `/api/purchases/:id` | Update purchase |
| POST | `/api/purchases/:id/receive` | Receive items (updates stock) |
| DELETE | `/api/purchases/:id` | Delete purchase |

### Expenses — `/api/expenses`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/expenses` | List expenses (filterable by category, date) |
| GET | `/api/expenses/categories` | Get distinct expense categories |
| GET | `/api/expenses/:id` | Get expense details |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |

### Payments — `/api/payments`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/payments` | List payments (filterable) |
| GET | `/api/payments/:id` | Get payment details |
| POST | `/api/payments` | Record payment against sale/purchase |
| PUT | `/api/payments/:id` | Update payment |
| DELETE | `/api/payments/:id` | Delete payment (reverses financials) |

### Reports — `/api/reports`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reports/sales` | Sales report (daily/weekly/monthly/yearly) |
| GET | `/api/reports/purchases` | Purchase report |
| GET | `/api/reports/profit-loss` | Profit & loss statement |
| GET | `/api/reports/inventory` | Inventory/stock report |
| GET | `/api/reports/top-products` | Top selling products |
| GET | `/api/reports/customers` | Customer report with totals |
| GET | `/api/reports/expenses` | Expense report |
| GET | `/api/reports/export` | Export report as CSV/PDF |

### Dashboard — `/api/dashboard`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/stats` | Today's stats (sales, profit, top products) |
| GET | `/api/dashboard/charts` | Chart data (weekly/monthly trends) |
| GET | `/api/dashboard/activity` | Recent store activity |

### Subscriptions — `/api/subscriptions`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/subscriptions` | Yes | Get current subscription |
| GET | `/api/subscriptions/plans` | Yes | List available plans |
| GET | `/api/subscriptions/status` | Yes | Check subscription status (active/trial/expired) |
| POST | `/api/subscriptions/subscribe` | Yes | Subscribe/change plan |
| POST | `/api/subscriptions/cancel` | Yes | Cancel auto-renewal |
| GET | `/api/subscriptions/payment-methods` | Yes | List active payment gateways (bKash, Bank) |
| POST | `/api/subscriptions/manual-payment` | Yes | Submit manual payment with transaction ID |
| GET | `/api/subscriptions/payments` | Yes | View own payment history |

### Backups — `/api/backup`

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/api/backup` | Any | List store backups |
| POST | `/api/backup` | Any | Create new backup |
| GET | `/api/backup/:id` | Any | Get backup info |
| GET | `/api/backup/:id/download` | Any | Download backup file |
| POST | `/api/backup/:id/restore` | super_admin | Restore from backup |
| DELETE | `/api/backup/:id` | Any | Delete backup |

### Notifications — `/api/notifications`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications` | List notifications (paginated) |
| GET | `/api/notifications/unread-count` | Get unread count |
| PUT | `/api/notifications/:id/read` | Mark single as read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| DELETE | `/api/notifications` | Clear all notifications |
| DELETE | `/api/notifications/:id` | Delete notification |

### Health — `/api/health`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health check, returns `{ status: "ok" }` |

### Super Admin — `/api/admin/tenants`

All routes require `super_admin` role.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/tenants` | List all stores (paginated, searchable) |
| GET | `/api/admin/tenants/stats` | System-wide dashboard stats |
| POST | `/api/admin/tenants` | Create a new tenant (password: `tenant`) |
| GET | `/api/admin/tenants/payments` | List all manual payments (filterable) |
| PATCH | `/api/admin/tenants/payments/:id` | Approve/reject a manual payment |
| GET | `/api/admin/tenants/gateways` | List all payment gateways |
| PUT | `/api/admin/tenants/gateways/:id` | Update gateway config |
| GET | `/api/admin/tenants/:id` | Get tenant details |
| PUT | `/api/admin/tenants/:id` | Update tenant |
| PATCH | `/api/admin/tenants/:id/status` | Update tenant status |
| POST | `/api/admin/tenants/:id/change-plan` | Change tenant's subscription plan |
| POST | `/api/admin/tenants/:id/suspend` | Suspend tenant |
| POST | `/api/admin/tenants/:id/activate` | Activate tenant |
| DELETE | `/api/admin/tenants/:id` | Delete tenant and all data |

---

## Payment Flow Guide

### Payment Methods (Stored in DB)

Two default gateways are seeded:

| Method | Slug | Type | Details |
|--------|------|------|---------|
| **bKash** | `bkash` | Mobile Banking | Send to merchant number, submit TrxID |
| **Bank Transfer** | `bank` | Bank Transfer | Transfer to account, submit reference |

Super Admin can update gateway details (number, account info) via `PUT /api/admin/tenants/gateways/:id`.

### Store Owner Payment Flow

1. Go to **Subscription** → **Plans** tab
2. Choose a paid plan (Basic or Pro)
3. Select **bKash** or **Bank Transfer** as payment method
4. Send the exact amount to the gateway details shown
5. Enter the **Transaction ID / Reference Number** and submit
6. Status shows **Pending** — wait for admin approval
7. Super Admin receives notification, reviews, and **Approves** or **Rejects**
8. On approval, subscription activates immediately; plan limits apply

### Super Admin Payment Approval

1. Go to **Admin Dashboard** → **Payments**
2. See all pending payments with store name, amount, method, transaction ID
3. Click **Approve** to activate the subscription
4. Optionally add admin notes
5. The system auto-updates: subscription → active, store → active, limits applied

---

## User Guide

### For Super Admin

**Dashboard** (`/admin/dashboard`)
- View total stores, active subscriptions, MRR, user count
- See store growth chart, revenue chart, plan distribution
- Recent registrations list

**Tenants** (`/admin/tenants`)
- **List**: View all stores, search by name/email
- **Create**: Add new tenant — provide name, email, optional plan/status. Default password: `tenant`
- **Edit**: Update store details, status, limits
- **Suspend/Activate**: Suspend disables all users; activate restores
- **Change Plan**: Switch tenant between Free/Basic/Pro
- **Delete**: Removes tenant and ALL associated data (irreversible)

**Payments** (`/admin/tenants/payments`)
- View all manual payment submissions
- Approve or reject with admin notes
- Approved payments auto-activate the subscription

**Gateways** (`/admin/tenants/gateways`)
- View and update payment gateway configurations
- Update bKash number, bank account details, instructions
- Enable/disable gateways

### For Store Owner

**Dashboard** (`/app/dashboard`)
- Today's sales, profit, top products
- Low stock alerts
- Recent activity feed

**POS** (`/app/pos`)
- Barcode scanner input
- Product search, category filter
- Customer selection, discount application
- Multiple payment methods
- Invoice PDF generation

**Products** (`/app/products`)
- CRUD operations with barcode generation
- Stock adjustments
- Category management
- Bulk price/stock updates

**Sales** (`/app/sales`)
- View all sales with invoice numbers
- Cancel sales (restores stock, reverts customer balance)
- Payment tracking

**Purchases** (`/app/purchases`)
- Create purchase orders
- Receive items (auto-updates stock)
- Supplier management with balance tracking

**Customers & Suppliers**
- Full CRUD with search
- Loyalty points and balance tracking
- Purchase/sales history

**Reports** (`/app/reports`)
- Sales, purchases, profit/loss
- Inventory, top products, customer reports
- CSV/PDF export

**Subscription** (`/app/subscription`)
- View current plan, status, usage
- Change plan, submit manual payment
- View payment history

**Staff** (`/app/users`)
- Add/remove staff (within plan limit)
- Assign roles (manager, employee)
- Set granular permissions

### For Manager / Employee

Managers have access to products, sales, purchases, customers, reports, expenses.
Employees have limited POS and product access (configurable by owner).

---

## Development Guide

### Project Structure

```
shopmanager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (19 models)
│   │   └── migrations/         # Prisma migrations
│   ├── src/
│   │   ├── server.js           # Express entry point
│   │   ├── config/             # Logger, socket, seed
│   │   ├── lib/                # Prisma client singleton
│   │   ├── middleware/         # auth, validate, errorHandler
│   │   ├── routes/             # 17 route files (110+ routes)
│   │   ├── controllers/        # 18 controllers
│   │   ├── services/           # Business logic (7 services)
│   │   ├── validators/         # Joi schemas (5 validators)
│   │   └── utils/              # Helpers, response, permissions
│   ├── logs/                   # Winston logs
│   └── uploads/                # File uploads
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/           # Auth, Theme, Store contexts
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # 23 page components
│   │   ├── services/           # Axios API layer
│   │   └── utils/              # Formatters, constants
│   └── package.json
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
└── docs/
    ├── api.md
    └── deployment.md
```

### Common Commands

```bash
# Backend
cd backend
npm run dev          # Development with auto-restart
npm run start        # Production start
npm run seed         # Seed database (plans, admin, gateways)
npm run migrate      # Run pending migrations

# Prisma
npx prisma studio    # DB browser (localhost:5555)
npx prisma generate  # Regenerate client after schema change
npx prisma migrate dev --name <name>  # Create + apply migration
npx prisma migrate deploy             # Apply pending migrations
```

### Adding a New Feature

1. **Schema**: Add/modify model in `prisma/schema.prisma`
2. **Migrate**: `npx prisma migrate dev --name describe_change`
3. **Generate**: `npx prisma generate`
4. **Service**: Add business logic in `src/services/`
5. **Controller**: Add handler in `src/controllers/`
6. **Route**: Add route in `src/routes/`
7. **Validator**: Add Joi schema in `src/validators/` if needed

### Code Conventions

- All async route handlers wrapped with `asyncHandler`
- Responses use `utils/response.js` helpers (`.success()`, `.created()`, `.error()`, `.notFound()`)
- BigInt IDs converted via `BigInt()` for Prisma queries
- Store-scoped queries always filter by `store_id: req.tenantId`
- All Prisma errors caught by global `errorHandler.js`

---

## Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Use strong, unique `JWT_SECRET` and `JWT_REFRESH_SECRET`
3. Configure `CORS_ORIGIN` to your frontend domain
4. Set up MySQL with remote access or use managed DB
5. Run `npm run migrate` to apply migrations
6. Run `npm run seed` once
7. Use `npm run start` (runs migrations + starts server)

### Docker Deployment

```bash
docker-compose -f docker/docker-compose.yml up -d --build
```

Services:
- **Backend**: `localhost:5000`
- **Frontend**: `localhost:3000`
- **phpMyAdmin**: `localhost:8080`

### Recommended Hosting

| Provider | Plan | Price |
|----------|------|-------|
| DigitalOcean | Basic droplet | $6/mo |
| Linode | Nanode 1GB | $5/mo |
| Hetzner | CX22 | $4.49/mo |
| AWS | t3a.nano | ~$4/mo |

### SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d yourdomain.com
```
