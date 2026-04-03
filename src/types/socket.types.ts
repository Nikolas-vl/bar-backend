import type { OrderStatus, OrderType } from '../generated/prisma/client';

export interface OrderStatusPayload {
  orderId: number;
  status: OrderStatus;
  updatedAt: string;
}

export interface NewOrderPayload {
  orderId: number;
  userId: number;
  type: OrderType;
  total: string;
  itemCount: number;
}

export interface ReservationStatusPayload {
  reservationId: number;
  status: string;
  tableId: number | null;
  updatedAt: string;
}

export interface NewReservationPayload {
  reservationId: number;
  userId: number;
  date: string;
  guests: number;
}
