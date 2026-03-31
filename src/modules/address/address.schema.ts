import { z } from 'zod';

const POLISH_ZIP_REGEX = /^\d{2}-\d{3}$/;

export const createAddressSchema = z
  .object({
    city: z.string().min(1, 'City is required'),
    street: z.string().min(1, 'Street is required'),
    zip: z.string().min(1, 'ZIP code is required').regex(POLISH_ZIP_REGEX, 'ZIP code must be in XX-XXX format (e.g. 00-001)'),
  })
  .strict();

export const updateAddressSchema = createAddressSchema.partial();

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
