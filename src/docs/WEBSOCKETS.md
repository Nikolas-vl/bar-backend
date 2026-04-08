# WebSocket Documentation

This document describes the real-time WebSocket layer in Jolie Brasserie Café.
The implementation uses **Socket.IO 4** on both the server and client.

---

## Table of Contents

1. [Server Setup](#server-setup)
2. [Authentication](#authentication)
3. [Rooms](#rooms)
4. [Connection Flow](#connection-flow)
5. [Event Reference](#event-reference)
   - [Server → Client Events](#server--client-events)
6. [Frontend Integration](#frontend-integration)
7. [Horizontal Scaling](#horizontal-scaling)

---

## Server Setup

Socket.IO is initialised in `src/lib/socket/socket.ts` and attached to the Node.js `http.Server` in `src/index.ts`:

```typescript
const httpServer = http.createServer(app);
await initSocket(httpServer); // attaches Socket.IO + Redis adapter
httpServer.listen(BACKEND_PORT);
```

The Socket.IO server is configured with:

```typescript
new SocketServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(','),
    credentials: true,
  },
  transports: ['websocket', 'polling'], // WebSocket preferred, polling fallback
});
```

---

## Authentication

Every connection **must** supply a valid JWT access token via the Socket.IO `auth` option in the handshake.
Connections without a valid token are rejected before entering any room.

**Client-side:**

```typescript
import { io } from 'socket.io-client';

const socket = io(API_URL, {
  auth: {
    token: accessToken, // JWT access token from auth store
  },
  transports: ['websocket', 'polling'],
});
```

**Server-side middleware** (`src/lib/socket/socket.ts`):

```typescript
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));

  try {
    const payload = verifyAccessToken(token) as { userId: number; role: SocketRole };
    socket.userId = payload.userId;
    socket.role = payload.role;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});
```

**Error handling on the client:**

```typescript
socket.on('connect_error', err => {
  // err.message === 'Authentication required' | 'Invalid token'
  console.error('Socket connection failed:', err.message);
});
```

---

## Rooms

On successful connection, the server automatically joins the socket to the appropriate rooms:

| Room            | Condition                     | Purpose                                     |
| --------------- | ----------------------------- | ------------------------------------------- |
| `user:<userId>` | All authenticated users       | Receive personal order/reservation updates  |
| `room:admin`    | Users with `role === 'ADMIN'` | Receive new order/reservation notifications |

```typescript
io.on('connection', socket => {
  socket.join(`user:${socket.userId}`);

  if (socket.role === 'ADMIN') {
    socket.join('room:admin');
  }
});
```

---

## Connection Flow

```
Client                            Server
  |                                  |
  |── connect({ auth: { token } }) ──►|
  |                                  | verify JWT
  |                                  | join user:<userId>
  |                                  | join room:admin (if ADMIN)
  |◄──────── connected ──────────────|
  |                                  |
  |  ... user places an order ...    |
  |                                  |
  |                                  |◄── createOrder()
  |◄── order:new (admins only) ──────|  emitNewOrderToAdmins()
  |                                  |
  |  ... admin updates status ...    |
  |                                  |
  |                                  |◄── updateOrderStatus()
  |◄── order:status_updated ─────────|  emitOrderStatusUpdate(userId, payload)
  |    (to user:<userId> room)       |  emitOrderStatusUpdateToAdmins(payload)
  |                                  |
  |── disconnect ───────────────────►|
```

---

## Event Reference

There are currently **no Client → Server events** — all communication is Server → Client.

### Server → Client Events

---

### `order:new`

**Emitted when:** A customer successfully places a new order.

**Recipients:** All connected sockets in `room:admin`.

**Payload:**

```typescript
interface NewOrderPayload {
  orderId: number; // Order ID
  userId: number; // Customer's user ID
  type: OrderType; // 'DINE_IN' | 'DELIVERY' | 'TAKE_OUT'
  total: string; // Decimal string, e.g. "42.50"
  itemCount: number; // Number of dish items in the order
}
```

**Example:**

```json
{
  "orderId": 42,
  "userId": 7,
  "type": "DELIVERY",
  "total": "42.50",
  "itemCount": 3
}
```

**Frontend handler** (`useAdminOrderSocket`):

```typescript
socket.on('order:new', (payload: NewOrderPayload) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
  toast.info(`New order #${payload.orderId} — ${payload.type} (${payload.total})`);
});
```

---

### `order:status_updated`

**Emitted when:** An order's status changes — either by the customer cancelling (`cancelOrder`) or an admin updating status (`updateOrderStatus`).

**Recipients:**

| Emission                                 | Room            | Trigger           |
| ---------------------------------------- | --------------- | ----------------- |
| `emitOrderStatusUpdate(userId, payload)` | `user:<userId>` | Any status change |
| `emitOrderStatusUpdateToAdmins(payload)` | `room:admin`    | Any status change |

**Payload:**

```typescript
interface OrderStatusPayload {
  orderId: number; // Order ID
  status: OrderStatus; // 'NEW' | 'PAID' | 'PREPARING' | 'COMPLETED' | 'CANCELED'
  updatedAt: string; // ISO 8601 timestamp
}
```

**Example:**

```json
{
  "orderId": 42,
  "status": "PREPARING",
  "updatedAt": "2026-04-08T14:30:00.000Z"
}
```

**Frontend handler** (`useOrderSocket` — customer):

```typescript
socket.on('order:status_updated', (payload: OrderStatusPayload) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(payload.orderId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });

  const label = {
    PAID: 'Payment confirmed',
    PREPARING: 'Kitchen is preparing your order',
    COMPLETED: 'Your order is ready',
    CANCELED: 'Order was canceled',
  }[payload.status];

  if (label) toast.info(`🧾 ${label}`);
});
```

---

### `reservation:new`

**Emitted when:** A customer creates a new reservation.

**Recipients:** All connected sockets in `room:admin`.

**Payload:**

```typescript
interface NewReservationPayload {
  reservationId: number; // Reservation ID
  userId: number; // Customer's user ID
  date: string; // ISO 8601 datetime string
  guests: number; // Number of guests
}
```

**Example:**

```json
{
  "reservationId": 15,
  "userId": 7,
  "date": "2026-04-15T19:00:00.000Z",
  "guests": 3
}
```

**Frontend handler** (`useReservationSocket` — admin):

```typescript
socket.on('reservation:new', (payload: NewReservationPayload) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
  toast.info(`New reservation for ${payload.guests} guests`);
});
```

---

### `reservation:status_updated`

**Emitted when:** An admin updates a reservation's status (e.g. `PENDING → CONFIRMED`).

**Recipients:** `user:<userId>` of the reservation owner.

**Payload:**

```typescript
interface ReservationStatusPayload {
  reservationId: number; // Reservation ID
  status: ReservationStatus; // 'PENDING' | 'CONFIRMED' | 'CANCELED'
  tableId: number | null; // Assigned table ID (null if unassigned)
  updatedAt: string; // ISO 8601 timestamp
}
```

**Example:**

```json
{
  "reservationId": 15,
  "status": "CONFIRMED",
  "tableId": 3,
  "updatedAt": "2026-04-08T10:15:00.000Z"
}
```

**Frontend handler** (`useReservationSocket` — customer):

```typescript
socket.on('reservation:status_updated', (payload: ReservationStatusPayload) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.reservations.detail(payload.reservationId) });
  toast.info(`Reservation status: ${payload.status}`);
});
```

---

## Frontend Integration

### Singleton pattern

`src/shared/lib/socket.ts` manages a single Socket.IO instance for the entire application:

```typescript
let socket: Socket | null = null;

export const connectSocket  = (accessToken: string): Socket => { ... }
export const disconnectSocket = (): void => { ... }
export const getSocket = (): Socket => {
  if (!socket) throw new Error('Socket not initialised');
  return socket;
}
```

### Lifecycle

1. **Login / `setAuth()`** → `connectSocket(accessToken)` is called automatically from `auth.store.ts`.
2. **Logout / `clearAuth()`** → `disconnectSocket()` tears down the connection.
3. **Token expiry**: The access token used at connection time may expire. The frontend currently does not re-authenticate the socket after a token refresh. A full reconnect on next page navigation handles this in practice; an explicit reconnect on token refresh is on the roadmap.

### Hook registration

Socket hooks are registered at the layout level so they are active for the entire user session:

```
RootLayout
├── useOrderSocket()         ← customer order updates
└── useReservationSocket()   ← customer reservation updates

AdminLayout
├── useAdminOrderSocket()    ← admin: new orders + status changes
└── useReservationSocket()   ← admin: new reservations + status changes
```

---

## Horizontal Scaling

The Socket.IO server uses the **Redis adapter** (`@socket.io/redis-adapter`), which publishes events to all server instances via Redis Pub/Sub.

This means a message emitted on one backend instance is automatically broadcast to the correct room on every other instance — enabling stateless horizontal scaling.

```typescript
// src/lib/socket/socket.ts
pubClient = redis.duplicate();
subClient = redis.duplicate();
io.adapter(createAdapter(pubClient, subClient));
```

Both `pubClient` and `subClient` are dedicated Redis connections (duplicated from the main client) and are gracefully shut down with the server:

```typescript
// src/index.ts
await pubClient.quit();
await subClient.quit();
```
