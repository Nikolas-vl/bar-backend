import { Router } from 'express';
import { getMyProfile, updateMyProfile } from './user.controller';
import { validate } from '../../middlewares/validate';
import { updateProfileSchema } from './user.schema';

const router = Router();

router.get('/me', getMyProfile);
router.patch('/me', validate(updateProfileSchema), updateMyProfile);
export default router;
