import { Router } from 'express';
import { create, getAll, getOne, update, remove, setDefault } from './payment.controller';
import { validate } from '../../middlewares/validate';
import { createPaymentSchema, updatePaymentSchema } from './payment.schema';

const router = Router();

router.post('/', validate(createPaymentSchema), create);
router.get('/', getAll);
router.get('/:id', getOne);
router.patch('/:id', validate(updatePaymentSchema), update);
router.patch('/:id/default', setDefault);
router.delete('/:id', remove);

export default router;
