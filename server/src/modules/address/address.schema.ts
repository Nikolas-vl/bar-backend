import { z } from 'zod';

export const createAddressSchema = z.object({
  city: z.string(),
  street: z.string(),
  zip: z.string(),
});

export const updateAddressSchema = createAddressSchema.partial();
