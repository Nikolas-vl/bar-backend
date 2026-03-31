import { z } from 'zod';
import { POLISH_PHONE_REGEX } from '../auth/auth.schema';

export const updateProfileSchema = z
  .object({
    name: z.string().min(1).optional(),
    phone: z.string().regex(POLISH_PHONE_REGEX, 'Enter a valid Polish phone number (e.g. +48 123 456 789)').optional(),
    password: z.string().min(6).optional(),
    currentPassword: z.string().min(6).optional(),
  })
  .strict()
  .refine(data => !data.password || data.currentPassword, {
    message: 'currentPassword is required when changing password',
    path: ['currentPassword'],
  });

export const adminUpdateUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    phone: z.string().regex(POLISH_PHONE_REGEX, 'Enter a valid Polish phone number').optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
  })
  .strict();

export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
