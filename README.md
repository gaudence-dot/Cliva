# CLIVA Backend — Integrated Development MVP

This is a single Express backend containing the current CLIVA feature areas:

- Marketplace product listings, search, filters, update and delete
- Shopping carts
- Orders, seller decisions, delivery selection and status tracking
- Hiring & Services listings and booking requests
- Jobs and recruitment applications
- Conversations, messages and notifications
- Admin overview, reports and moderation endpoints

## Requirements

- Node.js 20 or newer
- npm

## Install and run (Windows PowerShell)

```powershell
npm.cmd install
npm.cmd start
```

Development mode:

```powershell
npm.cmd run dev
```

Open `http://localhost:3000/` or `http://localhost:3000/health`.

## Main API endpoints

### Marketplace and cart

- `GET /api/products?name=&category=&location=&minPrice=&maxPrice=&sort=newest|price_asc|price_desc`
- `POST /api/products`
- `GET /api/products/:productId`
- `PUT /api/products/:productId`
- `DELETE /api/products/:productId`
- `GET /api/cart/:cartId`
- `POST /api/cart/:cartId/items`
- `PATCH /api/cart/:cartId/items/:productId`
- `DELETE /api/cart/:cartId/items/:productId`
- `DELETE /api/cart/:cartId`

### Orders

- `POST /api/orders`
- `GET /api/orders/my-orders/:buyerRef`
- `GET /api/orders/seller/inbox`
- `GET /api/orders/:orderId`
- `PATCH /api/orders/:orderId/decision`
- `PATCH /api/orders/:orderId/delivery`
- `PATCH /api/orders/:orderId/status`
- `PATCH /api/orders/:orderId/cancel`

### Hiring & Services

- `GET /api/services?q=&category=&location=`
- `POST /api/services`
- `GET /api/services/:serviceId`
- `PUT /api/services/:serviceId`
- `DELETE /api/services/:serviceId`
- `POST /api/services/:serviceId/bookings`
- `GET /api/services/bookings/:bookingId`
- `PATCH /api/services/bookings/:bookingId/status`

### Jobs & Recruitment

- `GET /api/jobs?q=&location=&type=`
- `POST /api/jobs`
- `GET /api/jobs/:jobId`
- `PUT /api/jobs/:jobId`
- `POST /api/jobs/:jobId/applications`
- `GET /api/jobs/applications/:applicationId`
- `PATCH /api/jobs/applications/:applicationId/status`

### Messaging and notifications

- `POST /api/conversations`
- `GET /api/conversations/:conversationId`
- `POST /api/conversations/:conversationId/messages`
- `GET /api/notifications/:userRef`
- `PATCH /api/notifications/:notificationId/read`

### Administration

Set `ADMIN_API_KEY` in the environment. Then send it as the `x-admin-key` request header.

- `GET /api/admin/overview`
- `GET /api/admin/reports`
- `POST /api/admin/reports`
- `PATCH /api/admin/reports/:reportId`
- `PATCH /api/admin/products/:productId/status`
- `PATCH /api/admin/jobs/:jobId/status`

## Important integration and production notes

This is an integrated **development MVP**, not a production-ready deployment. All records are stored in process memory and disappear when the server restarts. Member 2 must connect the team's selected database and authentication/authorization system before real users or sensitive data are used.

The `buyerRef`, `sellerRef`, `providerRef`, `applicantRef` and `userRef` values are development placeholders, not verified identities. The current seller inbox and seller-side mutations are not protected by real seller ownership checks. Messaging participant references are also not authenticated. Do not expose this prototype publicly or use it for real payments or private user data.

Order stock checks are suitable only for a single-process demonstration. Production order placement must use database transactions and atomic stock updates to prevent overselling. Actual image upload/storage, payment processing, courier integration, password handling, and production authentication are not included.

Before deployment, integrate the database and identity contracts with Member 2, enforce role/ownership checks on every protected route, add automated tests, rate limiting, request logging, secure configuration and deployment settings.
