import { z } from 'zod';

export const cartItemExtraSchema = z.object({
  ingredientId: z.number().int().positive(),
  quantity: z.number().positive().default(1),
});

export const cartItemSchema = z.object({
  dishId: z.number().int().positive(),
  quantity: z.number().int().min(1).default(1),
  note: z.string().max(500).optional(),
  extras: z.array(cartItemExtraSchema).optional().default([]),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0),
});

export const updateCartItemExtraSchema = z.object({
  quantity: z.number().min(0),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CartItemExtraInput = z.infer<typeof cartItemExtraSchema>;
export type UpdateCartItemExtraInput = z.infer<typeof updateCartItemExtraSchema>;
