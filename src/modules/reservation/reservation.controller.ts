import { Request, Response } from 'express';
import * as service from './reservation.service';
import { ReservationQuery, AdminUpdateReservationInput, AdminCreateReservationInput, CreateReservationInput } from './reservation.schema';
import { paramSchema } from '../../utils/common.schema';

// ─── Customer ──────────────────────────────────────────────────────────────

export const createReservation = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const reservation = await service.createReservation(userId, req.body as CreateReservationInput);
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
  const result = await service.adminGetAllReservations(req.query as unknown as ReservationQuery);
  res.json(result);
};

export const adminCreateReservation = async (req: Request, res: Response) => {
  const reservation = await service.adminCreateReservation(req.body as AdminCreateReservationInput);
  res.status(201).json(reservation);
};

export const adminUpdateReservation = async (req: Request, res: Response) => {
  const { id } = paramSchema('id').parse(req.params);
  const reservation = await service.adminUpdateReservation(id, req.body as AdminUpdateReservationInput);
  res.json(reservation);
};

export const adminDeleteReservation = async (req: Request, res: Response) => {
  const { id } = paramSchema('id').parse(req.params);
  await service.adminDeleteReservation(id);
  res.status(204).end();
};
