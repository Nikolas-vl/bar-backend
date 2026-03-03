import { z } from 'zod';

// Create ingredient schema
export const createIngredientSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive().default(0),
});

// Update ingredient schema (partial of create)
export const updateIngredientSchema = createIngredientSchema.partial();

// Query filters schema
export const ingredientQuerySchema = z.object({
  search: z.string().optional(),
  sortBy: z.enum(['name', 'price']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Type exports
export type CreateIngredient = z.infer<typeof createIngredientSchema>;
export type UpdateIngredient = z.infer<typeof updateIngredientSchema>;
export type IngredientQuery = z.infer<typeof ingredientQuerySchema>;
