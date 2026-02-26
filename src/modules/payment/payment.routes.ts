import { Router } from 'express';
import { create, getAll, getOne, update, remove } from './payment.controller';
import { validate } from '../../middlewares/validate';
import { createPaymentSchema, updatePaymentSchema } from './payment.schema';

const router = Router();

router.post('/', validate(createPaymentSchema), create);
router.get('/', getAll);
router.get('/:id', getOne);
router.patch('/:id', validate(updatePaymentSchema), update);
router.delete('/:id', remove);

export default router;
