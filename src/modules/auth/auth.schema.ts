import { z } from 'zod';

export const POLISH_PHONE_REGEX = /^(\+48[\s-]?)?\d{3}[\s-]?\d{3}[\s-]?\d{3}$/;

export const SPECIAL_CHAR_REGEX = /[!@#$%^&*()\-_=+[\]{};:'",.<>?/\\|`~]/;

export const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.email('Invalid email'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .regex(SPECIAL_CHAR_REGEX, 'Password must contain at least one special character'),
    phone: z.string().min(1, 'Phone number is required').regex(POLISH_PHONE_REGEX, 'Enter a valid Polish phone number (e.g. +48 123 456 789)'),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
