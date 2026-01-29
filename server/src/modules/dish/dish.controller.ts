import { Request, Response } from 'express';
import * as dishService from './dish.service';

export const getDishes = async (_req: Request, res: Response) => {
  const dishes = await dishService.getAllDishes();
  res.json(dishes);
};

export const createDish = async (req: Request, res: Response) => {
  const dish = await dishService.createDish(req.body);
  res.status(201).json(dish);
};
