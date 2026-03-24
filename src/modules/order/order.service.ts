import Decimal from 'decimal.js';
import prisma from '../../prisma';
import { OrderStatus, PaymentStatus, PaymentType } from '../../generated/prisma/client';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { CreateOrderInput, UpdateOrderStatusInput, PayOrderInput, OrderQuery } from './order.schema';
import { calcFinalTotal } from '../../utils/pricing';

const orderInclude = {
  items: {
    include: {
      dish: true,
      extras: { include: { ingredient: true } },
    },
  },
  ingredientItems: {
    include: { ingredient: true },
  },
  address: true,
  payments: {
    include: {
      paymentMethod: {
        select: {
          id: true,
          cardType: true,
          last4: true,
          expMonth: true,
          expYear: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
} as const;

export const createOrder = async (userId: number, input: CreateOrderInput) => {
  return prisma.$transaction(async tx => {
    if (input.type === 'DELIVERY' && input.addressId) {
      const addr = await tx.address.findFirst({
        where: { id: input.addressId, userId },
      });
      if (!addr) throw new ValidationError('Delivery address not found or does not belong to you');
    }

    const cart = await tx.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            dish: true,
            extras: { include: { ingredient: true } },
          },
        },
        ingredientItems: {
          include: { ingredient: true },
        },
      },
    });

    if (!cart || (cart.items.length === 0 && cart.ingredientItems.length === 0)) {
      throw new ValidationError('Cart is empty');
    }

    const dishIds = cart.items.map(i => i.dishId);
    const unavailable = await tx.dish.findMany({
      where: { id: { in: dishIds }, isAvailable: false },
      select: { name: true },
    });

    if (unavailable.length > 0) {
      throw new ValidationError(`Cannot place order. The following dishes are currently unavailable: ${unavailable.map(d => d.name).join(', ')}`);
    }

    let subtotal = new Decimal(0);

    for (const item of cart.items) {
      subtotal = subtotal.plus(new Decimal(item.dish.price.toString()).times(item.quantity));
      for (const extra of item.extras) {
        subtotal = subtotal.plus(new Decimal(extra.ingredient.price.toString()).times(extra.quantity));
      }
    }
    for (const ingItem of cart.ingredientItems) {
      subtotal = subtotal.plus(new Decimal(ingItem.ingredient.price.toString()).times(ingItem.quantity));
    }

    const pricing = await calcFinalTotal(subtotal, input.discountPercent);

    const order = await tx.order.create({
      data: {
        userId,
        addressId: input.type === 'DELIVERY' ? (input.addressId ?? null) : null,
        type: input.type,
        comment: input.comment,
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        tax: pricing.tax,
        deliveryFee: pricing.deliveryFee,
        serviceFee: pricing.serviceFee,
        total: pricing.total,
        status: OrderStatus.NEW,
        paymentStatus: PaymentStatus.PENDING,
        items: {
          create: cart.items.map(item => ({
            dishId: item.dishId,
            quantity: item.quantity,
            note: item.note,
            extras: {
              create: item.extras.map(e => ({
                ingredientId: e.ingredientId,
                quantity: e.quantity,
              })),
            },
          })),
        },
        ingredientItems: {
          create: cart.ingredientItems.map(item => ({
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            note: item.note,
          })),
        },
      },
      include: orderInclude,
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cartIngredientItem.deleteMany({ where: { cartId: cart.id } });

    return order;
  });
};

export const getUserOrders = async (userId: number, query: OrderQuery) => {
  const { status, page, limit } = query;
  const skip = (page - 1) * limit;

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where: { userId, ...(status && { status }) },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({
      where: { userId, ...(status && { status }) },
    }),
  ]);

  return { orders, total, page, limit };
};

export const getUserOrderById = async (userId: number, orderId: number) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: orderInclude,
  });

  if (!order) throw new NotFoundError('Order not found');

  return order;
};

export const cancelOrder = async (userId: number, orderId: number) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });

  if (!order) throw new NotFoundError('Order not found');

  if (order.status === OrderStatus.CANCELED) {
    throw new ValidationError('Order is already canceled');
  }

  if (order.status === OrderStatus.PREPARING || order.status === OrderStatus.COMPLETED) {
    throw new ValidationError(`Cannot cancel an order with status: ${order.status}`);
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.CANCELED },
    include: orderInclude,
  });
};

export const payOrder = async (userId: number, orderId: number, input: PayOrderInput) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });

  if (!order) throw new NotFoundError('Order not found');

  if (order.paymentStatus === PaymentStatus.SUCCESS) {
    throw new ValidationError('Order is already paid');
  }

  if (order.status === OrderStatus.CANCELED) {
    throw new ValidationError('Cannot pay for a cancelled order');
  }

  if (input.type === PaymentType.CARD && input.paymentMethodId) {
    const method = await prisma.paymentMethod.findFirst({
      where: { id: input.paymentMethodId, userId },
    });
    if (!method) throw new NotFoundError('Payment method not found');
  }

  const isCash = input.type === PaymentType.CASH;

  const simulatedStatus: PaymentStatus = isCash
    ? PaymentStatus.PENDING
    : input.type === PaymentType.BLIK && Math.random() < 0.1
      ? PaymentStatus.FAILED
      : PaymentStatus.SUCCESS;

  return prisma.$transaction(async tx => {
    const payment = await tx.payment.create({
      data: {
        orderId,
        userId,
        amount: order.total,
        type: input.type,
        paymentMethodId: input.paymentMethodId ?? null,
        status: simulatedStatus,
      },
    });

    if (simulatedStatus === PaymentStatus.SUCCESS) {
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.SUCCESS,
          status: OrderStatus.PAID,
        },
      });
    }

    return {
      payment,
      success: isCash || simulatedStatus === PaymentStatus.SUCCESS,
      message: isCash
        ? 'Order placed. Please pay at the counter.'
        : simulatedStatus === PaymentStatus.SUCCESS
          ? 'Payment successful'
          : 'Payment failed. Please try again.',
    };
  });
};

// ─── Admin ─────────────────────────────────────────────────────────────────

export const getAllOrders = async (query: OrderQuery) => {
  const { status, page, limit } = query;
  const skip = (page - 1) * limit;

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where: { ...(status && { status }) },
      include: {
        ...orderInclude,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({
      where: { ...(status && { status }) },
    }),
  ]);

  return { orders, total, page, limit };
};

export const getOrderById = async (orderId: number) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      ...orderInclude,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!order) throw new NotFoundError('Order not found');

  return order;
};

export const updateOrderStatus = async (orderId: number, input: UpdateOrderStatusInput) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) throw new NotFoundError('Order not found');

  const paymentStatusPatch =
    input.status === OrderStatus.PAID && order.paymentStatus !== PaymentStatus.FAILED ? { paymentStatus: PaymentStatus.SUCCESS } : {};

  return prisma.order.update({
    where: { id: orderId },
    data: { status: input.status, ...paymentStatusPatch },
    include: orderInclude,
  });
};

export const deleteOrder = async (orderId: number) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) throw new NotFoundError('Order not found');

  return prisma.$transaction(async tx => {
    await tx.payment.deleteMany({ where: { orderId } });
    await tx.orderIngredientItem.deleteMany({ where: { orderId } });
    await tx.orderItem.deleteMany({ where: { orderId } });
    return tx.order.delete({ where: { id: orderId } });
  });
};
