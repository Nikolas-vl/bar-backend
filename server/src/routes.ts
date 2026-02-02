import { Router } from 'express'
import dishRoutes from './modules/dish/dish.routes'
import authRoutes from './modules/auth/auth.routes';

const router = Router()

router.use('/dishes', dishRoutes)
router.use('/auth', authRoutes);

export default router
