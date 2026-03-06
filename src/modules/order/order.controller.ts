import * as service from './order.service';
import { orderQuerySchema } from './order.schema';
import { paramSchema } from '../../utils/common.schema';
import { Request, Response } from 'express';

// ─── User ──────────────────────────────────────────────────────────────────

export const createOrder = async (req: Request, res: Response) => {
  const userId = req.userId!;
  req.log.info({ userId, body: req.body }, 'Creating order');

  const order = await service.createOrder(userId, req.body);

  req.log.info({ userId, orderId: order.id }, 'Order created');
  res.status(201).json(order);
};

export const getMyOrders = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const query = orderQuerySchema.parse(req.query);
  req.log.info({ userId, query }, 'Fetching user orders');

  const result = await service.getUserOrders(userId, query);
  res.json(result);
};

export const getMyOrderById = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { orderId } = paramSchema('orderId').parse(req.params);
  req.log.info({ userId, orderId }, 'Fetching order');

  const order = await service.getUserOrderById(userId, orderId);
  res.json(order);
};

export const cancelMyOrder = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { orderId } = paramSchema('orderId').parse(req.params);
  req.log.info({ userId, orderId }, 'Cancelling order');

  const order = await service.cancelOrder(userId, orderId);

  req.log.info({ userId, orderId }, 'Order cancelled');
  res.json(order);
};

export const payMyOrder = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { orderId } = paramSchema('orderId').parse(req.params);
  req.log.info({ userId, orderId, body: req.body }, 'Processing payment');

  const result = await service.payOrder(userId, orderId, req.body);

  req.log.info({ userId, orderId, success: result.success }, 'Payment processed');
  res.status(result.success ? 200 : 402).json(result);
};

// ─── Admin ─────────────────────────────────────────────────────────────────

export const adminGetAllOrders = async (req: Request, res: Response) => {
  const query = orderQuerySchema.parse(req.query);
  req.log.info({ query }, 'Admin fetching all orders');

  const result = await service.getAllOrders(query);
  res.json(result);
};

export const adminGetOrderById = async (req: Request, res: Response) => {
  const { orderId } = paramSchema('orderId').parse(req.params);
  req.log.info({ orderId }, 'Admin fetching order');

  const order = await service.getOrderById(orderId);
  res.json(order);
};

export const adminUpdateOrderStatus = async (req: Request, res: Response) => {
  const { orderId } = paramSchema('orderId').parse(req.params);
  req.log.info({ orderId, body: req.body }, 'Admin updating order status');

  const order = await service.updateOrderStatus(orderId, req.body);

  req.log.info({ orderId, status: order.status }, 'Order status updated');
  res.json(order);
};

export const adminDeleteOrder = async (req: Request, res: Response) => {
  const { orderId } = paramSchema('orderId').parse(req.params);
  req.log.info({ orderId }, 'Admin deleting order');

  await service.deleteOrder(orderId);

  req.log.info({ orderId }, 'Order deleted');
  res.status(204).end();
};
