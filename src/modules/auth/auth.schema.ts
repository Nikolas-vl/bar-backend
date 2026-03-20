import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .regex(/^\+?[0-9\s\-().]{7,20}$/, 'Invalid phone number'),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
