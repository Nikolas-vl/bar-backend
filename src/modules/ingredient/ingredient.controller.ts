import { Request, Response } from 'express';
import {
  getAllIngredients,
  getIngredientById,
  createIngredient as createIngredientService,
  updateIngredient as updateIngredientService,
  deleteIngredient as deleteIngredientService,
  getDishesByIngredient,
} from './ingredient.service';
import { ingredientQuerySchema } from './ingredient.schema';
import { paramSchema } from '../../utils/common.schema';

export const getIngredients = async (req: Request, res: Response) => {
  const query = ingredientQuerySchema.parse(req.query);
  req.log.info({ query }, 'Fetching ingredients');

  const ingredients = await getAllIngredients(query);
  res.json(ingredients);
};

export const getIngredient = async (req: Request, res: Response) => {
  const { id } = paramSchema('id').parse(req.params);
  req.log.info({ ingredientId: id }, 'Fetching ingredient');

  const ingredient = await getIngredientById(id);
  res.json(ingredient);
};

export const createIngredient = async (req: Request, res: Response) => {
  req.log.info({ data: req.body }, 'Creating ingredient');

  const ingredient = await createIngredientService(req.body);

  req.log.info({ ingredientId: ingredient.id }, 'Ingredient created');
  res.status(201).json(ingredient);
};

export const updateIngredient = async (req: Request, res: Response) => {
  const { id } = paramSchema('id').parse(req.params);
  req.log.info({ ingredientId: id, data: req.body }, 'Updating ingredient');

  const ingredient = await updateIngredientService(id, req.body);

  req.log.info({ ingredientId: ingredient.id }, 'Ingredient updated');
  res.json(ingredient);
};

export const deleteIngredient = async (req: Request, res: Response) => {
  const { id } = paramSchema('id').parse(req.params);
  req.log.info({ ingredientId: id }, 'Deleting ingredient');

  await deleteIngredientService(id);

  req.log.info({ ingredientId: id }, 'Ingredient deleted');
  res.json({ success: true });
};

export const getDishesWithIngredient = async (req: Request, res: Response) => {
  const { id } = paramSchema('id').parse(req.params);
  req.log.info({ ingredientId: id }, 'Fetching dishes with ingredient');

  const dishes = await getDishesByIngredient(id);
  res.json(dishes);
};
