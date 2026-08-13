## 🚀 Live Demo

Click the link below to access the deployed application:
👉Mini ERP & CRM Operations Portal](https://mini-erp-crm-operations-portal-xt71.vercel.app)
Role	        Email	                  Password
Admin	        admin@erp.com	          password123
Sales	        sales@erp.com	          password123
Warehouse	    warehouse@erp.com	      password123
Accounts	    accounts@erp.com	      password123

## Demo Video
Watch here: https://www.loom.com/share/5204f23179ff4167bc2bcee4d0372601


# Mini ERP + CRM Application

A full-stack, role-based Enterprise Resource Planning (ERP) and Customer Relationship Management (CRM) system built for small-to-medium businesses. It covers customer management, product inventory, delivery challans, and multi-role access control.

---

## Architecture Overview

### Backend
The backend is a **Node.js + TypeScript + Express** REST API server. It uses **Prisma ORM** to interact with a **PostgreSQL** database, providing a fully typed data layer with automatic migrations. Authentication is handled with **JWT (JSON Web Tokens)** — tokens are stateless and carry the user's ID, email, and role as claims. Input validation is done with **Zod** schemas attached via middleware, ensuring all API routes reject malformed payloads with structured `{ error, message }` JSON responses before any business logic runs. Role-based access control (RBAC) is enforced at the route level via `requireRoles()` middleware.

The most critical business logic lives in the Challan confirmation flow: when a challan is confirmed, the entire operation (stock deduction for all items + stock movement logging + status change) is wrapped in a **Prisma transaction**. If any single product lacks sufficient stock, the transaction is rolled back atomically and a `400 Insufficient Stock` error is returned — the database is never left in a partial state. Challan cancellation mirrors this: a CONFIRMED challan restores all stock with corresponding `StockMovement (IN)` records, giving a full audit trail.

### Frontend
The frontend is a **React 18 + TypeScript + Vite** single-page application using plain CSS. It is structured around React Router v6 with protected routes that check JWT validity and user role. A global `AuthContext` holds the logged-in user state, sourced from `localStorage` on mount. Navigation is role-aware — the sidebar hides links that a user's role cannot access, and routes render a 403/redirect if accessed directly. API calls are made via an **Axios** instance with a request interceptor that injects the Bearer token and a response interceptor that redirects to `/login` on 401.

### Data Flow
```
Browser → React (Vite) → Axios → Express API → Prisma → PostgreSQL
                          ↑ JWT Auth Header on every request
```

---

## Project Structure

```
fundsroom-project/
├── docker-compose.yml          # PostgreSQL + pgAdmin
├── README.md
├── postman_collection.json     # API test collection
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma       # Data models
│   │   └── seed.ts             # Sample data seeder
│   └── src/
│       ├── index.ts            # Express app entry point
│       ├── middleware/
│       │   ├── auth.ts         # JWT + role guards
│       │   └── validate.ts     # Zod request validation
│       └── routes/
│           ├── auth.ts
│           ├── customers.ts
│           ├── products.ts
│           ├── challans.ts
│           └── users.ts
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    ├── .env.example
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── api/               # Axios API calls per domain
        ├── context/           # AuthContext
        ├── types/             # TypeScript interfaces
        ├── components/        # Layout, Sidebar, Pagination, Toast
        └── pages/             # customers/, products/, challans/, users/
```

---

## Prerequisites

- **Node.js** v18+ and npm
- **Docker + Docker Compose** (for the database)
- Git

---

## Quick Start

### 1. Clone & Navigate

```bash
git clone <repo-url> fundsroom-project
cd fundsroom-project
```

### 2. Start the Database

```bash
docker-compose up -d
```

This starts PostgreSQL on port `5432` and pgAdmin on port `5050`.  
pgAdmin login: `admin@admin.com` / `admin`

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env if needed (default values work with docker-compose)
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

The API server starts at `http://localhost:3001`.

### 4. Frontend Setup

```bash
cd ../frontend
cp .env.example .env
npm install
npm run dev
```

The frontend starts at `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/erp_crm` | PostgreSQL connection string |
| `JWT_SECRET` | *(change this!)* | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | `7d` | JWT expiry duration |
| `PORT` | `3001` | Express server port |
| `NODE_ENV` | `development` | Runtime environment |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001/api` | Backend API base URL |

---

## Seed Users (all passwords: `password123`)

| Email | Role | Access |
|---|---|---|
| `admin@erp.com` | ADMIN | Full access to all features |
| `sales@erp.com` | SALES | Customers, Challans (read/write) |
| `warehouse@erp.com` | WAREHOUSE | Products, Stock movements |
| `accounts@erp.com` | ACCOUNTS | Read-only across all modules |

---

## Role Permissions Matrix

| Feature | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|---|:---:|:---:|:---:|:---:|
| View Customers | ✅ | ✅ | ✅ | ✅ |
| Create/Edit Customers | ✅ | ✅ | ❌ | ❌ |
| Add Follow-up Notes | ✅ | ✅ | ❌ | ❌ |
| View Products | ✅ | ✅ | ✅ | ✅ |
| Create/Edit Products | ✅ | ❌ | ✅ | ❌ |
| Adjust Stock | ✅ | ❌ | ✅ | ❌ |
| View Challans | ✅ | ✅ | ✅ | ✅ |
| Create/Confirm Challans | ✅ | ✅ | ❌ | ❌ |
| Cancel Challans | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |

---

## API Overview

Base URL: `http://localhost:3001/api`

All routes (except `POST /auth/login`) require `Authorization: Bearer <token>` header.

| Method | Route | Description |
|---|---|---|
| POST | `/auth/login` | Login, returns JWT |
| POST | `/auth/register` | Register new user (ADMIN only) |
| GET | `/customers` | List customers (search, status, page) |
| GET | `/customers/:id` | Customer detail with notes |
| POST | `/customers` | Create customer |
| PUT | `/customers/:id` | Update customer |
| DELETE | `/customers/:id` | Soft-delete (set INACTIVE) |
| POST | `/customers/:id/notes` | Add follow-up note |
| GET | `/products` | List products (search, category, page) |
| GET | `/products/:id` | Product detail |
| POST | `/products` | Create product |
| PUT | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |
| POST | `/products/:id/stock-movement` | Adjust stock (IN/OUT) |
| GET | `/products/:id/stock-history` | Stock movement history |
| GET | `/challans` | List challans (status, customerId, page) |
| GET | `/challans/:id` | Challan detail with items |
| POST | `/challans` | Create draft challan |
| PATCH | `/challans/:id` | Edit draft challan items |
| POST | `/challans/:id/confirm` | Confirm challan (deducts stock atomically) |
| POST | `/challans/:id/cancel` | Cancel challan (restores stock if confirmed) |
| GET | `/users` | List users (ADMIN only) |
| PUT | `/users/:id` | Update user (ADMIN only) |
| DELETE | `/users/:id` | Delete user (ADMIN only) |

---

## Known Limitations & Assumptions

1. **No invoice/billing module**: Challans serve as delivery notes only; invoicing/GST invoice generation is not implemented.
2. **No file uploads**: Customer or product images are not supported.
3. **No email notifications**: Follow-up date reminders, low stock alerts, etc. are not sent via email.
4. **Password reset**: There is no forgot-password flow; passwords can only be reset by an admin creating a new account or via direct database update.
5. **No pagination on challan items**: A challan is assumed to have a reasonable number of items (< 100) and all are fetched at once.
6. **Decimal precision**: `unitPrice` is stored as `Decimal` in Prisma (mapped to `NUMERIC` in PostgreSQL) and serialized as a string in JSON responses. The frontend parses it with `parseFloat()`.
7. **GST Number validation**: The regex enforces 15-character alphanumeric format but does not validate checksum.
8. **Token refresh**: JWTs are not refreshed automatically. After expiry (7 days default), the user must log in again.
9. **Concurrency**: The stock confirmation transaction uses Prisma's default isolation level. Under very high concurrent load, a more pessimistic locking strategy (SELECT FOR UPDATE) may be needed.
10. **Mobile responsiveness**: The sidebar collapses below 768px but the app is primarily designed for desktop/tablet admin use.
11. **Challan numbering**: Numbers are generated as `CH-` + zero-padded count of total challans + 1. In concurrent environments this could create gaps (not duplicates, which are prevented by `@unique`).

---

## Development Tips

- Run `npx prisma studio` in the backend folder to view/edit data in a GUI at `http://localhost:5555`.
- The Postman collection (`postman_collection.json`) at the root has all routes pre-configured. Import it and set the `base_url` and `token` variables.
- For hot-reload on backend: `npm run dev` uses `ts-node-dev` which watches for file changes.
- Run `npx prisma migrate reset` to wipe the database and re-seed from scratch.
