import { Router } from 'express';
import { getDishes, createDish } from './dish.controller';
import { createDishSchema } from '../../validation/dish.schema';
import { validate } from '../../middlewares/validate';

const router = Router();
router.get('/', getDishes);

router.post('/', validate(createDishSchema), createDish);
export default router;
