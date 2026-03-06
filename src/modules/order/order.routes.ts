import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { requireRole } from '../../middlewares/role.middleware';
import { createOrderSchema, updateOrderStatusSchema, payOrderSchema, orderQuerySchema } from './order.schema';
import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  payMyOrder,
  adminGetAllOrders,
  adminGetOrderById,
  adminUpdateOrderStatus,
  adminDeleteOrder,
} from './order.controller';

const router = Router();

// ─── User routes ───────────────────────────────────────────────────────────
router.post('/', validate(createOrderSchema), createOrder);
router.get('/', validate(orderQuerySchema, 'query'), getMyOrders);
router.get('/:orderId', getMyOrderById);
router.patch('/:orderId/cancel', cancelMyOrder);
router.post('/:orderId/pay', validate(payOrderSchema), payMyOrder);

// ─── Admin routes ──────────────────────────────────────────────────────────
router.get('/admin/all', requireRole('ADMIN'), validate(orderQuerySchema, 'query'), adminGetAllOrders);
router.get('/admin/:orderId', requireRole('ADMIN'), adminGetOrderById);
router.patch('/admin/:orderId/status', requireRole('ADMIN'), validate(updateOrderStatusSchema), adminUpdateOrderStatus);
router.delete('/admin/:orderId', requireRole('ADMIN'), adminDeleteOrder);

export default router;
