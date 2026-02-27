import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const idAndIngredientIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  ingredientId: z.coerce.number().int().positive(),
});
