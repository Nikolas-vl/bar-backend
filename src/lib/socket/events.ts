import { getIO } from './socket';
import type { OrderStatusPayload, NewOrderPayload, ReservationStatusPayload, NewReservationPayload } from '../../types/socket.types';

export const emitOrderStatusUpdate = (userId: number, payload: OrderStatusPayload) => {
  getIO().to(`user:${userId}`).emit('order:status_updated', payload);
};

export const emitNewOrderToAdmins = (payload: NewOrderPayload) => {
  getIO().to('room:admin').emit('order:new', payload);
};
export const emitReservationStatusUpdate = (userId: number, payload: ReservationStatusPayload) => {
  getIO().to(`user:${userId}`).emit('reservation:status_updated', payload);
};

export const emitNewReservationToAdmins = (payload: NewReservationPayload) => {
  getIO().to('room:admin').emit('reservation:new', payload);
};
