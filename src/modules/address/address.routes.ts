import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { createMyAddress, deleteMyAddress, getMyAddresses, updateMyAddress } from './address.controller';
import { createAddressSchema, updateAddressSchema } from './address.schema';
import { ownsAddress } from '../../middlewares/ownership';

const router = Router();

router.post('/', validate(createAddressSchema), createMyAddress);
router.get('/', getMyAddresses);
router.patch('/:id', validate(updateAddressSchema), ownsAddress, updateMyAddress);

router.delete('/:id', ownsAddress, deleteMyAddress);

export default router;
