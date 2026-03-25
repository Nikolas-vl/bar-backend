# Jolie Brasserie Café — Backend API

Production-grade REST API for a full-stack restaurant management platform.

This service handles authentication, orders, reservations, menu management, and pricing logic for a multi-location café system.

---

## 🚀 Overview

The backend powers both:

- **Customer-facing application** (orders, cart, reservations)
- **Admin panel** (management of orders, users, menu, tables, settings)

Built with a strong focus on:

- type safety
- modular architecture
- predictable data flow
- production-ready patterns

---

## 🧩 Core Features

### Customer Domain

- Menu browsing (search, filters, sorting)
- Cart management (dish extras, ingredient items, notes)
- Order creation (Dine-In / Take-Out / Delivery)
- Reservation system with pre-order support
- Payment flow (Card / BLIK / Cash — simulated)
- User profile & address management

### Admin Domain

- Orders management (status transitions, breakdown)
- Reservations (CRUD, conflict detection, table assignment)
- Menu & ingredient management
- Users management with RBAC
- Multi-location table management
- Dynamic pricing configuration (tax, delivery fee, service fee)

---

## 🛠 Tech Stack

| Layer      | Technology                       |
| ---------- | -------------------------------- |
| Runtime    | Node.js                          |
| Framework  | Express 5                        |
| Language   | TypeScript                       |
| ORM        | Prisma 7 (`@prisma/adapter-pg`)  |
| Database   | PostgreSQL                       |
| Validation | Zod                              |
| Auth       | JWT (access + refresh)           |
| Hashing    | bcrypt                           |
| Logging    | Pino + pino-http                 |
| Email      | Nodemailer (Ethereal)            |
| Security   | Helmet, CORS, express-rate-limit |
| Money math | decimal.js                       |

---

## 🏗 Architecture

### Pattern

**Module-per-domain + Controller-Service architecture**

Each domain is isolated and follows the same structure:

```
module/
├── *.routes.ts      # Route definitions
├── *.controller.ts  # HTTP layer
├── *.service.ts     # Business logic
└── *.schema.ts      # Zod validation
```

---

### Project Structure

```
src/
├── modules/      # Domain modules (auth, cart, order, etc.)
├── middlewares/  # Auth, validation, RBAC, error handling
├── utils/        # Shared utilities (JWT, pricing, mailer, errors)
├── prisma.ts     # Prisma client singleton
├── app.ts        # Express configuration
└── index.ts      # Entry point
```

---

## 🔄 Request Flow

```
Request
↓
Route
↓
Zod Validation Middleware
↓
Controller
↓
Service (business logic)
↓
Prisma ORM
↓
PostgreSQL
↓
Response
```

---

## 🔐 Authentication

- JWT-based authentication:
  - **Access Token** (short-lived)
  - **Refresh Token** (rotation-based)

- Refresh tokens stored server-side for session control

- RBAC (Role-Based Access Control):
  - `USER`
  - `ADMIN`

---

## 💰 Pricing System

All monetary calculations use **decimal.js** to avoid floating-point errors.

Handled server-side:

- subtotal
- tax
- delivery fee
- service fee
- free delivery threshold

> The backend is the **single source of truth** for all pricing.

---

## ⚙️ Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create `.env`:

```env
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
PORT=3000
```

### 3. Database

```bash
npx prisma migrate dev
```

**(Optional)**

```bash
npm run seed
```

---

## ▶️ Running the App

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

---

## 📡 API Overview

| Domain       | Endpoint        | Method   | Auth  |
| ------------ | --------------- | -------- | ----- |
| Auth         | `/auth/login`   | POST     | ❌    |
| Auth         | `/auth/refresh` | POST     | ❌    |
| Users        | `/users/me`     | GET      | ✅    |
| Cart         | `/cart`         | GET/POST | ✅    |
| Orders       | `/orders`       | GET/POST | ✅    |
| Reservations | `/reservations` | CRUD     | ✅    |
| Dishes       | `/dishes`       | GET      | ❌    |
| Admin        | `/admin/*`      | various  | ADMIN |

---

## 🧠 Notable Engineering Decisions

- **Prisma Driver Adapter (`@prisma/adapter-pg`)**
  - Direct control over connection pooling
  - Better compatibility with serverless environments
- **Zod Validation Layer**
  - Strict validation before controllers
  - Guarantees clean input for services
- **decimal.js for financial logic**
  - Prevents rounding errors in totals
- **Centralized Error Handler**
  - Maps Prisma errors (P2002, P2025, etc.) to HTTP responses
- **Reusable `paramSchema` factory**
  - Eliminates repetitive param validation logic
- **Ownership middleware (`ownsResource`)**
  - Generic authorization guard across domains

---

## ⚠️ Limitations

- Email uses Ethereal (dev only)
- Payments are simulated
- No real-time updates (no WebSockets/SSE)
- Rate limiting is currently disabled
- No file/image upload support

---

## 🛣 Roadmap

- OAuth (Google)
- Redis caching layer
- Real payment integration (Stripe)
- Real SMTP provider (Resend / SendGrid)
- WebSocket/SSE for real-time updates
- Shared schema package (frontend + backend)
- Cloudinary for image uploads
- Integration & E2E tests

---

## 🧪 Testing (Planned)

- Unit tests (services, utilities)
- Integration tests (API endpoints)
- E2E tests (critical flows)

---

## 📚 Documentation

- [Architecture Overview](src/docs/ARCHITECTURE.md)

---

## 📄 License

MIT
