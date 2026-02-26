import { Router } from 'express';
import dishRoutes from './modules/dish/dish.routes';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import addressRoutes from './modules/address/address.routes';
import paymentRoutes from './modules/payment/payment.routes';
import { requireAuth } from './middlewares/auth';

const router = Router();

router.use('/dishes', dishRoutes);
router.use('/auth', authRoutes);
router.use('/users', requireAuth, userRoutes);
router.use('/addresses', requireAuth, addressRoutes);
router.use('/payment', requireAuth, paymentRoutes);

export default router;
