# شموخ ERP API

REST API for the Shumoukh ERP system — roof tile project management, supplier marketplace, and construction calculator.

## Architecture

```
Client (React SPA) → REST API (Express/Firebase Admin) → Firestore
                    → Cloud Function (Python) → Roof skeletonization
                    → Firebase Auth
                    → Firebase Storage
```

**Stack:** Node.js 20, Express 4, TypeScript 5, Firebase Admin SDK 12, Zod validation

## Getting Started

```bash
cd api
npm install
cp .env.example .env
# Edit .env with your Firebase Admin credentials
npm run dev
```

## API Reference

Base URL: `/api/v1`

### Authentication

All endpoints except `POST /auth/register` and `POST /auth/login` require a Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

### Auth Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/register` | Create new account | No |
| POST | `/auth/login` | Login (returns uid + role) | No |
| GET | `/auth/profile` | Get current user profile | Yes |
| PUT | `/auth/profile` | Update profile (displayName, companyName) | Yes |

### Project Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/projects` | Create project |
| GET | `/projects` | List user's projects |
| GET | `/projects/:id` | Get project details |
| PUT | `/projects/:id` | Update project |
| DELETE | `/projects/:id` | Delete project |
| POST | `/projects/:id/payments` | Add payment |
| DELETE | `/projects/:id/payments/:pid` | Delete payment |

**Project Schema:**
```typescript
{
  id: string;
  userId: string;
  status: "draft" | "sent" | "approved" | "in_progress" | "completed";
  client?: { name: string; phone?: string; address?: string };
  order: Array<{ id: string; name: string; unit: string; quantity: number; received: number }>;
  payments: Array<{ id: string; amount: number; date: string; method?: string }>;
  calculatorData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

### Supplier Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/suppliers` | Register as supplier | Yes |
| GET | `/suppliers` | List suppliers (?approved=true&hasPrices=true) | Yes |
| GET | `/suppliers/:uid` | Get supplier details | Yes |
| PUT | `/suppliers/:uid` | Update supplier | Owner/Admin |
| PUT | `/suppliers/:uid/approve` | Approve/reject supplier | Admin |
| POST | `/suppliers/:uid/ban` | Toggle ban | Admin |
| GET | `/suppliers/:uid/products` | List supplier products | Yes |
| POST | `/suppliers/:uid/products` | Add product | Owner/Admin |
| PUT | `/suppliers/:uid/products/:pid` | Update product | Owner/Admin |
| DELETE | `/suppliers/:uid/products/:pid` | Delete product | Owner/Admin |
| GET | `/suppliers/:uid/ratings` | List ratings | Yes |
| POST | `/suppliers/:uid/ratings` | Add rating | Yes |
| GET | `/suppliers/:uid/offers` | List supplier offers | Yes |
| POST | `/suppliers/:uid/offers` | Create offer | Owner/Admin |
| DELETE | `/suppliers/offers/:oid` | Delete offer | Owner/Admin |
| GET | `/suppliers/active-offers` | List active offers | Yes |

### Invoice Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/invoices` | Create invoice |
| GET | `/invoices` | List invoices (admin: all, user: own) |
| GET | `/invoices/:id` | Get invoice |
| PUT | `/invoices/:id/status` | Update status (draft/pending/paid) |
| DELETE | `/invoices/:id` | Delete invoice |

### Worker Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/workers` | Add worker |
| GET | `/workers` | List workers |
| GET | `/workers/:id` | Get worker |
| PUT | `/workers/:id` | Update worker |
| DELETE | `/workers/:id` | Delete worker |

### Announcement Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/announcements/published` | List published announcements | Yes |
| GET | `/announcements` | List all announcements | Admin |
| GET | `/announcements/:id` | Get announcement | Admin |
| POST | `/announcements` | Create announcement | Admin |
| PUT | `/announcements/:id` | Update announcement | Admin |
| DELETE | `/announcements/:id` | Delete announcement | Admin |
| GET | `/announcements/notifications` | Get user notifications | Yes |
| POST | `/announcements/notifications/:id/read` | Mark as read | Yes |
| POST | `/announcements/notifications/:id/unread` | Mark as unread | Yes |

### Admin Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/config` | Get program config |
| PUT | `/admin/config` | Update program config |
| GET | `/admin/stats` | Dashboard statistics |
| GET | `/admin/audit-logs` | View audit logs |
| GET | `/admin/online` | List online users |
| GET | `/users` | List all users |
| PUT | `/users/:uid/role` | Change user role |
| POST | `/users/:uid/ban` | Toggle user ban |
| PUT | `/users/:uid/subscription` | Set subscription |

### Calculator Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/calculator/config` | Full calculator config |
| GET | `/calculator/materials` | Tile catalog |
| GET | `/calculator/market-lengths` | Available market lengths |
| GET | `/calculator/order-items` | Default order items |
| GET | `/calculator/extra-items` | Extra items list |

### Roof Skeleton Endpoint

| Method | Path | Description |
|--------|------|-------------|
| POST | `/roof/skeletonize` | Compute roof skeleton (proxies to Python Cloud Function) |

### Analytics Endpoints (Admin)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/dashboard` | Aggregated platform stats |
| GET | `/analytics/users-growth` | Monthly user signups |

### Health Check

| Method | Path |
|--------|------|
| GET | `/health` |

## Error Handling

All errors return consistent JSON:

```json
{
  "error": "وصف الخطأ بالعربية",
  "details": [{ "field": "email", "message": "البريد الإلكتروني غير صالح" }]
}
```

HTTP status codes:
- `200` — Success
- `201` — Created
- `400` — Validation error
- `401` — Unauthenticated
- `403` — Forbidden
- `404` — Not found
- `409` — Conflict (e.g., email exists)
- `500` — Internal error

## Data Model

### Firestore Collections

```
users/{uid}/
  profile/main          # User profile (role, subscription, companyName)
  projects/{id}         # Per-user projects
  notifications/{id}    # Read notification tracking

users-public/{uid}      # Public profile (email, displayName, lastLogin)

suppliers/{uid}         # Supplier profile
  products/{id}         # Supplier's products
  ratings/{id}          # User ratings

offers/{id}             # Supplier offers

announcements/{id}      # System announcements

invoices/{id}           # Invoices (userId for ownership)
workers/{id}            # Workers (userId for ownership)

config/program          # Program configuration (tile catalog, prices, items)

audit_logs/{id}         # Admin audit trail
presence/{uid}          # Online status
visitors/{id}           # Visitor tracking
```

## Deployment

### Option 1: Standalone Server

```bash
npm run build
npm start
```

### Option 2: Firebase Cloud Function

The app is exported as a callable function (`export const api`). Deploy with:

```bash
npm run deploy
```

### Required Firestore Indexes

Create these composite indexes in Firebase Console:

1. `invoices` collection: `userId` ASC, `createdAt` DESC
2. `workers` collection: `userId` ASC, `createdAt` DESC
3. `offers` collection: `supplierId` ASC, `createdAt` DESC
4. `offers` collection: `active` ASC, `createdAt` DESC
5. `announcements` collection: `published` ASC, `createdAt` DESC
6. `suppliers` collection: `approved` ASC, `createdAt` DESC
