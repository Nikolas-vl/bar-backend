import { z } from 'zod';

export const createPaymentSchema = z.object({
  cardType: z.string().min(2),
  last4: z.string().length(4),
  expMonth: z.number().min(1).max(12),
  expYear: z.number().min(new Date().getFullYear()),
});

export const updatePaymentSchema = createPaymentSchema.partial();
