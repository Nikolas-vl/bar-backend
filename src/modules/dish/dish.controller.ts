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
  manageDishImage as manageDishImageService,
  deleteDishImage as deleteDishImageService,
} from './dish.service';
import { DishQuery } from './dish.schema';
import { paramSchema } from '../../utils/common.schema';
import { uploadImage } from '../../lib/cloudinary/uploadToCloudinary';

export const getDishes = async (req: Request, res: Response) => {
  req.log.info({ query: req.query }, 'Fetching dishes');

  const dishes = await getAllDishes(req.query as DishQuery);
  res.json(dishes);
};

export const getDish = async (req: Request, res: Response) => {
  const { id } = paramSchema('id').parse(req.params);
  req.log.info({ dishId: id }, 'Fetching dish');

  const dish = await getDishById(id);
  res.json(dish);
};

export const createDish = async (req: Request, res: Response) => {
  const dish = await createDishService(req.body);
  res.status(201).json(dish);
};

export const updateDish = async (req: Request, res: Response) => {
  const { id } = paramSchema('id').parse(req.params);
  req.log.info({ dishId: id, data: req.body }, 'Updating dish');

  const dish = await updateDishService(id, req.body);

  req.log.info({ dishId: dish.id }, 'Dish updated');
  res.json(dish);
};

export const deleteDish = async (req: Request, res: Response) => {
  const { id } = paramSchema('id').parse(req.params);
  req.log.info({ dishId: id }, 'Deleting dish');

  await deleteDishService(id);

  req.log.info({ dishId: id }, 'Dish deleted');
  res.json({ success: true });
};

export const addIngredientToDish = async (req: Request, res: Response) => {
  const { id } = paramSchema('id').parse(req.params);
  req.log.info({ dishId: id, data: req.body }, 'Adding ingredient to dish');

  const dishIngredient = await addIngredientService(id, req.body);

  req.log.info({ dishId: id, ingredientId: dishIngredient.ingredientId }, 'Ingredient added to dish');
  res.status(201).json(dishIngredient);
};

export const removeIngredientFromDish = async (req: Request, res: Response) => {
  const { id, ingredientId } = paramSchema('id', 'ingredientId').parse(req.params);
  req.log.info({ dishId: id, ingredientId }, 'Removing ingredient from dish');

  await removeIngredientService(id, ingredientId);

  req.log.info({ dishId: id, ingredientId }, 'Ingredient removed from dish');
  res.json({ success: true });
};

export const updateDishIngredient = async (req: Request, res: Response) => {
  const { id, ingredientId } = paramSchema('id', 'ingredientId').parse(req.params);
  req.log.info({ dishId: id, ingredientId, data: req.body }, 'Updating dish ingredient');

  const updated = await updateDishIngredientService(id, ingredientId, req.body);

  req.log.info({ dishId: id, ingredientId }, 'Dish ingredient updated');
  res.json(updated);
};

export const manageDishImage = async (req: Request, res: Response) => {
  const { id: dishId } = paramSchema('id').parse(req.params);

  if (req.file) {
    const result = await uploadImage(req.file.buffer);
    const dish = await manageDishImageService(dishId, result.secure_url, result.public_id);
    return res.json(dish);
  }
  if (req.query.action === 'delete') {
    const dish = await deleteDishImageService(dishId);
    return res.json(dish);
  }

  return res.status(400).json({ message: 'No file uploaded' });
};
