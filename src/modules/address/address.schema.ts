import { z } from 'zod';

export const createAddressSchema = z.object({
  city: z.string(),
  street: z.string(),
  zip: z.string(),
});

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
