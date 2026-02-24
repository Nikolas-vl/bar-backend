import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createMyAddress, deleteMyAddress, getMyAddresses, updateMyAddress } from './address.controller';
import { createAddressSchema, updateAddressSchema } from './address.schema';
import { ownsAddress } from '../../middlewares/ownership';

const router = Router();

router.post('/', requireAuth, validate(createAddressSchema), createMyAddress);
router.get('/', requireAuth, getMyAddresses);
router.patch('/:id', requireAuth, validate(updateAddressSchema), ownsAddress, updateMyAddress);

router.delete('/:id', requireAuth, ownsAddress, deleteMyAddress);

export default router;
