import { Request, Response } from 'express';
import {
  createIngredient as createIngredientService,
  deleteIngredient as deleteIngredientService,
  getAllIngredients,
  getIngredientById,
  updateIngredient as updateIngredientService,
  getDishesByIngredient,
} from './ingredient.service';
import { IngredientQuery } from './ingredient.schema';

export const getIngredients = async (req: Request, res: Response) => {
  req.log.info({ query: req.query }, 'Fetching ingredients');
  const ingredients = await getAllIngredients(req.query as IngredientQuery);
  res.json(ingredients);
};

export const getIngredient = async (req: Request, res: Response) => {
  const { id } = req.params;
  req.log.info({ ingredientId: id }, 'Fetching ingredient');

  const ingredient = await getIngredientById(Number(id));

  if (!ingredient) {
    req.log.warn({ ingredientId: id }, 'Ingredient not found');
    return res.status(404).json({ message: 'Ingredient not found' });
  }

  res.json(ingredient);
};

export const createIngredient = async (req: Request, res: Response) => {
  req.log.info({ data: req.body }, 'Creating ingredient');

  const ingredient = await createIngredientService(req.body);

  req.log.info({ ingredientId: ingredient.id }, 'Ingredient created');
  res.status(201).json(ingredient);
};

export const updateIngredient = async (req: Request, res: Response) => {
  const { id } = req.params;
  req.log.info({ ingredientId: id, data: req.body }, 'Updating ingredient');

  const ingredient = await updateIngredientService(Number(id), req.body);

  req.log.info({ ingredientId: ingredient.id }, 'Ingredient updated');
  res.json(ingredient);
};

export const deleteIngredient = async (req: Request, res: Response) => {
  const { id } = req.params;
  req.log.info({ ingredientId: id }, 'Deleting ingredient');

  await deleteIngredientService(Number(id));

  req.log.info({ ingredientId: id }, 'Ingredient deleted');
  res.json({ success: true });
};

export const getDishesWithIngredient = async (req: Request, res: Response) => {
  const { id } = req.params;
  req.log.info({ ingredientId: id }, 'Fetching dishes with ingredient');

  const dishes = await getDishesByIngredient(Number(id));
  res.json(dishes);
};
