import { Request, Response } from 'express';
import {
  createDish as createDishService,
  deleteDish as deleteDishService,
  getAllDishes,
  getDishById,
  updateDish as updateDishService,
  addIngredientToDish as addIngredientService,
  removeIngredientFromDish as removeIngredientService,
  updateDishIngredient as updateDishIngredientService,
} from './dish.service';
import { DishQuery } from './dish.schema';

export const getDishes = async (req: Request, res: Response) => {
  req.log.info({ query: req.query }, 'Fetching dishes');

  const dishes = await getAllDishes(req.query as DishQuery);
  res.json(dishes);
};

export const getDish = async (req: Request, res: Response) => {
  const { id } = req.params;
  req.log.info({ dishId: id }, 'Fetching dish');

  const dish = await getDishById(Number(id));

  if (!dish) {
    req.log.warn({ dishId: id }, 'Dish not found');
    return res.status(404).json({ message: 'Dish not found' });
  }

  res.json(dish);
};

export const createDish = async (req: Request, res: Response) => {
  const dish = await createDishService(req.body);
  res.status(201).json(dish);
};

export const updateDish = async (req: Request, res: Response) => {
  const { id } = req.params;
  req.log.info({ dishId: id, data: req.body }, 'Updating dish');

  const dish = await updateDishService(Number(id), req.body);

  req.log.info({ dishId: dish.id }, 'Dish updated');
  res.json(dish);
};

export const deleteDish = async (req: Request, res: Response) => {
  const { id } = req.params;
  req.log.info({ dishId: id }, 'Deleting dish');

  await deleteDishService(Number(id));

  req.log.info({ dishId: id }, 'Dish deleted');
  res.json({ success: true });
};

export const addIngredientToDish = async (req: Request, res: Response) => {
  const { id } = req.params;
  req.log.info({ dishId: id, data: req.body }, 'Adding ingredient to dish');

  const dishIngredient = await addIngredientService(Number(id), req.body);

  req.log.info({ dishId: id, ingredientId: dishIngredient.ingredientId }, 'Ingredient added to dish');
  res.status(201).json(dishIngredient);
};

export const removeIngredientFromDish = async (req: Request, res: Response) => {
  const { id, ingredientId } = req.params;
  req.log.info({ dishId: id, ingredientId }, 'Removing ingredient from dish');

  await removeIngredientService(Number(id), Number(ingredientId));

  req.log.info({ dishId: id, ingredientId }, 'Ingredient removed from dish');
  res.json({ success: true });
};

export const updateDishIngredient = async (req: Request, res: Response) => {
  const { id, ingredientId } = req.params;
  req.log.info({ dishId: id, ingredientId, data: req.body }, 'Updating dish ingredient');

  const updated = await updateDishIngredientService(Number(id), Number(ingredientId), req.body);

  req.log.info({ dishId: id, ingredientId }, 'Dish ingredient updated');
  res.json(updated);
};
