import { z } from 'zod';
import { Category } from '../../../generated/prisma/client';

// Dish ingredient sub-schema
export const dishIngredientSchema = z.object({
  ingredientId: z.number().int().positive(),
  quantity: z.number().positive().default(1),
  optional: z.boolean().default(false),
});

// Create dish schema
export const createDishSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive(),
  imageUrl: z.url().optional(),
  calories: z.number().int().positive().optional(),
  protein: z.number().positive().optional(),
  fat: z.number().positive().optional(),
  carbs: z.number().positive().optional(),
  category: z.enum(Category).optional(),
  isAvailable: z.boolean().optional(),
  ingredients: z.array(dishIngredientSchema).optional(),
});

export const updateDishSchema = createDishSchema.partial();

export const dishQuerySchema = z.object({
  search: z.string().optional(),
  category: z.enum(Category).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minCalories: z.coerce.number().int().positive().optional(),
  maxCalories: z.coerce.number().int().positive().optional(),
  isAvailable: z
    .preprocess(val => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return val;
    }, z.boolean())
    .optional(),
  sortBy: z.enum(['name', 'price', 'calories', 'protein', 'fat', 'carbs']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const addIngredientToDishSchema = z.object({
  ingredientId: z.number().int().positive(),
  quantity: z.number().positive().default(1),
  optional: z.boolean().default(false),
});

export const updateDishIngredientSchema = z.object({
  quantity: z.number().positive().optional(),
  optional: z.boolean().optional(),
});

export type CreateDish = z.infer<typeof createDishSchema>;
export type UpdateDish = z.infer<typeof updateDishSchema>;
export type DishQuery = z.infer<typeof dishQuerySchema>;
export type AddIngredientToDish = z.infer<typeof addIngredientToDishSchema>;
export type UpdateDishIngredient = z.infer<typeof updateDishIngredientSchema>;
