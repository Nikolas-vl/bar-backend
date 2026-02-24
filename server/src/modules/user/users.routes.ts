import { Router } from 'express';
import { getMyProfile, updateMyProfile } from './users.controller';

const router = Router();

router.get('/me', getMyProfile);
router.patch('/me', updateMyProfile);
export default router;
