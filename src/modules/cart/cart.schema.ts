import { z } from 'zod';

export const cartItemExtraSchema = z.object({
  ingredientId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
  note: z.string().max(500).optional(),
});

export const cartItemSchema = z.object({
  dishId: z.number().int().positive(),
  quantity: z.number().int().min(1).default(1),
  note: z.string().max(500).optional(),
  extras: z.array(cartItemExtraSchema).optional().default([]),
});

export const updateCartItemSchema = z
  .object({
    quantity: z.number().int().min(0).optional(),
    note: z.string().max(500).nullable().optional(),
  })
  .refine(data => data.quantity !== undefined || data.note !== undefined, {
    message: 'At least one of quantity or note must be provided',
  });

export const updateCartItemExtraSchema = z
  .object({
    quantity: z.number().int().min(0).optional(),
    note: z.string().max(500).nullable().optional(),
  })
  .refine(data => data.quantity !== undefined || data.note !== undefined, {
    message: 'At least one of quantity or note must be provided',
  });

// --- Ingredient items ---

export const cartIngredientItemSchema = z.object({
  ingredientId: z.number().int().positive(),
  quantity: z.number().int().min(1).default(1),
  note: z.string().max(500).optional(),
});

export const updateCartIngredientItemSchema = z
  .object({
    quantity: z.number().int().min(0).optional(),
    note: z.string().max(500).nullable().optional(),
  })
  .refine(data => data.quantity !== undefined || data.note !== undefined, {
    message: 'At least one of quantity or note must be provided',
  });

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CartItemExtraInput = z.infer<typeof cartItemExtraSchema>;
export type UpdateCartItemExtraInput = z.infer<typeof updateCartItemExtraSchema>;
export type CartIngredientItemInput = z.infer<typeof cartIngredientItemSchema>;
export type UpdateCartIngredientItemInput = z.infer<typeof updateCartIngredientItemSchema>;
