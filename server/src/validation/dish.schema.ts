import { z } from 'zod';

export const createDishSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  imageUrl: z.url().optional(),
  calories: z.number().int().positive().optional(),
  protein: z.number().positive().optional(),
  fat: z.number().positive().optional(),
  carbs: z.number().positive().optional(),
});
