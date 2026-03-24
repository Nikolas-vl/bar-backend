import { z } from 'zod';
import { OrderType, OrderStatus, PaymentType } from '../../generated/prisma/client';

export const createOrderSchema = z
  .object({
    type: z.enum(OrderType),
    comment: z.string().max(1000).optional(),
    discountPercent: z.number().min(0).max(100).default(0),
    addressId: z.number().int().positive().optional(),
  })
  .strict()
  .refine(data => data.type !== 'DELIVERY' || data.addressId !== undefined, {
    message: 'addressId is required for DELIVERY orders',
    path: ['addressId'],
  });

export const updateOrderStatusSchema = z
  .object({
    status: z.enum(OrderStatus),
  })
  .strict();

export const payOrderSchema = z
  .object({
    type: z.enum(PaymentType),
    paymentMethodId: z.number().int().positive().optional(),
  })
  .strict()
  .refine(data => data.type !== PaymentType.CARD || data.paymentMethodId !== undefined, {
    message: 'paymentMethodId is required for CARD payments',
    path: ['paymentMethodId'],
  });

export const orderQuerySchema = z.object({
  status: z.enum(OrderStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type PayOrderInput = z.infer<typeof payOrderSchema>;
export type OrderQuery = z.infer<typeof orderQuerySchema>;
