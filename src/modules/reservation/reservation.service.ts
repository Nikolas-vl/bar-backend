import prisma from '../../prisma';
import { ReservationStatus } from '../../generated/prisma/client';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { sendReservationConfirmation } from '../../utils/mailer';
import { getSettings } from '../settings/settings.service';
import { CreateReservationInput, AdminCreateReservationInput, AdminUpdateReservationInput, ReservationQuery } from './reservation.schema';
import { emitReservationStatusUpdate, emitNewReservationToAdmins } from '../../lib/socket/events';

const SLOT_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

const reservationInclude = {
  table: { include: { location: true } },
  preOrders: { include: { dish: true } },
  user: { select: { id: true, name: true, email: true } },
};

const checkTableConflict = async (tableId: number, date: Date, excludeId?: number) => {
  const slotStart = new Date(date.getTime() - SLOT_DURATION_MS);
  const slotEnd = new Date(date.getTime() + SLOT_DURATION_MS);

  const conflict = await prisma.reservation.findFirst({
    where: {
      tableId,
      status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
      date: { gte: slotStart, lt: slotEnd },
      ...(excludeId && { id: { not: excludeId } }),
    },
  });

  if (conflict) {
    throw new ValidationError('Table is already booked for this time slot');
  }
};

const validatePreOrders = async (preOrders: { dishId: number; quantity: number }[]) => {
  const dishIds = preOrders.map(p => p.dishId);
  const dishes = await prisma.dish.findMany({ where: { id: { in: dishIds } } });

  if (dishes.length !== dishIds.length) {
    throw new ValidationError('One or more pre-order dishes do not exist');
  }
};

// ─── Customer ──────────────────────────────────────────────────────────────

export const createReservation = async (userId: number, input: CreateReservationInput) => {
  if (input.preOrders.length > 0) {
    await validatePreOrders(input.preOrders);
  }

  const reservation = await prisma.reservation.create({
    data: {
      userId,
      date: input.date,
      guests: input.guests,
      comment: input.comment,
      preOrders: {
        create: input.preOrders,
      },
    },
    include: reservationInclude,
  });

  emitNewReservationToAdmins({
    reservationId: reservation.id,
    userId,
    date: reservation.date.toISOString(),
    guests: reservation.guests,
  });

  return reservation;
};

export const getMyReservations = async (userId: number) => {
  return prisma.reservation.findMany({
    where: { userId },
    include: reservationInclude,
    orderBy: { date: 'desc' },
  });
};

export const getMyReservationById = async (userId: number, id: number) => {
  const reservation = await prisma.reservation.findFirst({
    where: { id, userId },
    include: reservationInclude,
  });

  if (!reservation) throw new NotFoundError('Reservation not found');

  return reservation;
};

export const cancelMyReservation = async (userId: number, id: number) => {
  const reservation = await prisma.reservation.findFirst({
    where: { id, userId },
  });

  if (!reservation) throw new NotFoundError('Reservation not found');

  if (reservation.status === ReservationStatus.CANCELED) {
    throw new ValidationError('Reservation is already canceled');
  }

  return prisma.reservation.update({
    where: { id },
    data: { status: ReservationStatus.CANCELED },
    include: reservationInclude,
  });
};

// ─── Admin ─────────────────────────────────────────────────────────────────

export const adminGetAllReservations = async (query: ReservationQuery) => {
  const { date, status, tableId, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(status && { status }),
    ...(tableId && { tableId }),
    ...(date && {
      date: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999)),
      },
    }),
  };

  const [reservations, total] = await prisma.$transaction([
    prisma.reservation.findMany({
      where,
      include: reservationInclude,
      orderBy: { date: 'asc' },
      skip,
      take: limit,
    }),
    prisma.reservation.count({ where }),
  ]);

  return { reservations, total, page, limit };
};

export const adminCreateReservation = async (input: AdminCreateReservationInput) => {
  if (input.preOrders.length > 0) {
    await validatePreOrders(input.preOrders);
  }

  if (input.tableId) {
    await checkTableConflict(input.tableId, input.date);
  }

  return prisma.reservation.create({
    data: {
      userId: input.userId,
      date: input.date,
      guests: input.guests,
      comment: input.comment,
      tableId: input.tableId,
      status: input.status ?? ReservationStatus.PENDING,
      preOrders: { create: input.preOrders },
    },
    include: reservationInclude,
  });
};

export const adminUpdateReservation = async (id: number, input: AdminUpdateReservationInput) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { user: true, table: true, preOrders: { include: { dish: true } } },
  });

  if (!reservation) throw new NotFoundError('Reservation not found');

  const newTableId = input.tableId !== undefined ? input.tableId : reservation.tableId;
  const newDate = input.date ?? reservation.date;

  if (newTableId) {
    await checkTableConflict(newTableId, newDate, id);
  }

  if (input.preOrders) {
    await validatePreOrders(input.preOrders);
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: {
      ...(input.date && { date: input.date }),
      ...(input.guests && { guests: input.guests }),
      ...(input.tableId !== undefined && { tableId: input.tableId }),
      ...(input.status && { status: input.status }),
      ...(input.comment !== undefined && { comment: input.comment }),
      ...(input.preOrders && {
        preOrders: {
          deleteMany: {},
          create: input.preOrders,
        },
      }),
    },
    include: reservationInclude,
  });

  // Send confirmation email when status changes to CONFIRMED
  if (input.status === ReservationStatus.CONFIRMED && updated.table) {
    const settings = await getSettings();
    await sendReservationConfirmation({
      to: reservation.user.email,
      name: reservation.user.name ?? 'Guest',
      date: updated.date,
      guests: updated.guests,
      tableNumber: updated.table.number,
      locationName: updated.table.location.name,
      locationAddress: updated.table.location.address,
      restaurantName: settings.restaurantName,
      preOrders: updated.preOrders.map(p => ({
        dishName: p.dish.name,
        quantity: p.quantity,
      })),
    });
  }

  emitReservationStatusUpdate(reservation.userId, {
    reservationId: updated.id,
    status: updated.status,
    tableId: updated.tableId,
    updatedAt: new Date().toISOString(),
  });

  return updated;
};

export const adminDeleteReservation = async (id: number) => {
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) throw new NotFoundError('Reservation not found');

  return prisma.reservation.delete({ where: { id } });
};
