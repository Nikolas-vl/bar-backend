import { z } from 'zod';

export const createAddressSchema = z
  .object({
    city: z.string().min(1, 'City is required'),
    street: z.string().min(1, 'Street is required'),
    zip: z.string().min(1, 'ZIP is required'),
  })
  .strict();

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
