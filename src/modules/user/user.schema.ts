import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
});
