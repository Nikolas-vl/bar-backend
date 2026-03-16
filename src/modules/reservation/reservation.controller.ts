import { Request, Response } from 'express';
import * as service from './reservation.service';
import { reservationQuerySchema } from './reservation.schema';
import { paramSchema } from '../../utils/common.schema';

// ─── Customer ──────────────────────────────────────────────────────────────

export const createReservation = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const reservation = await service.createReservation(userId, req.body);
  res.status(201).json(reservation);
};

export const getMyReservations = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const reservations = await service.getMyReservations(userId);
  res.json(reservations);
};

export const getMyReservationById = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = paramSchema('id').parse(req.params);
  const reservation = await service.getMyReservationById(userId, id);
  res.json(reservation);
};

export const cancelMyReservation = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { id } = paramSchema('id').parse(req.params);
  const reservation = await service.cancelMyReservation(userId, id);
  res.json(reservation);
};

// ─── Admin ─────────────────────────────────────────────────────────────────

export const adminGetAllReservations = async (req: Request, res: Response) => {
  const query = reservationQuerySchema.parse(req.query);
  const result = await service.adminGetAllReservations(query);
  res.json(result);
};

export const adminCreateReservation = async (req: Request, res: Response) => {
  const reservation = await service.adminCreateReservation(req.body);
  res.status(201).json(reservation);
};

export const adminUpdateReservation = async (req: Request, res: Response) => {
  const { id } = paramSchema('id').parse(req.params);
  const reservation = await service.adminUpdateReservation(id, req.body);
  res.json(reservation);
};

export const adminDeleteReservation = async (req: Request, res: Response) => {
  const { id } = paramSchema('id').parse(req.params);
  await service.adminDeleteReservation(id);
  res.status(204).end();
};
