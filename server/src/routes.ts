import { Router } from 'express'
import dishRoutes from './modules/dish/dish.routes'


const router = Router()

router.use('/dishes', dishRoutes)


export default router
