import { z } from 'zod';
import { ReservationStatus } from '../../../generated/prisma/client';

const preOrderItemSchema = z.object({
  dishId: z.number().int().positive(),
  quantity: z.number().int().min(1).default(1),
});

export const createReservationSchema = z.object({
  date: z.coerce.date().refine(d => d > new Date(), {
    message: 'Reservation date must be in the future',
  }),
  guests: z.number().int().min(1),
  comment: z.string().max(500).optional(),
  preOrders: z.array(preOrderItemSchema).optional().default([]),
});

export const adminCreateReservationSchema = createReservationSchema.extend({
  userId: z.number().int().positive(),
  tableId: z.number().int().positive().optional(),
  status: z.enum(ReservationStatus).optional(),
});

export const adminUpdateReservationSchema = z.object({
  date: z.coerce
    .date()
    .refine(d => d > new Date(), {
      message: 'Reservation date must be in the future',
    })
    .optional(),
  guests: z.number().int().min(1).optional(),
  tableId: z.number().int().positive().nullable().optional(),
  status: z.enum(ReservationStatus).optional(),
  comment: z.string().max(500).optional(),
  preOrders: z.array(preOrderItemSchema).optional(),
});

export const reservationQuerySchema = z.object({
  date: z.coerce.date().optional(),
  status: z.enum(ReservationStatus).optional(),
  tableId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type AdminCreateReservationInput = z.infer<typeof adminCreateReservationSchema>;
export type AdminUpdateReservationInput = z.infer<typeof adminUpdateReservationSchema>;
export type ReservationQuery = z.infer<typeof reservationQuerySchema>;
