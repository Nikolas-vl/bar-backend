import { Router } from 'express';
import dishRoutes from './modules/dish/dish.routes';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/users.routes';
import addressRoutes from './modules/address/address.routes';
import { requireAuth } from './middlewares/auth';

const router = Router();

router.use('/dishes', dishRoutes);
router.use('/auth', authRoutes);
router.use('/users', requireAuth, userRoutes);
router.use('/addresses', requireAuth, addressRoutes);

export default router;
