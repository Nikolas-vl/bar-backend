import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { requireAuth } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/role.middleware';
import { createReservationSchema, adminCreateReservationSchema, adminUpdateReservationSchema, reservationQuerySchema } from './reservation.schema';
import {
  createReservation,
  getMyReservations,
  getMyReservationById,
  cancelMyReservation,
  adminGetAllReservations,
  adminCreateReservation,
  adminUpdateReservation,
  adminDeleteReservation,
} from './reservation.controller';

const router = Router();

// ─── Customer routes ───────────────────────────────────────────────────────
router.post('/', requireAuth, validate(createReservationSchema), createReservation);
router.get('/', requireAuth, getMyReservations);
router.get('/:id', requireAuth, getMyReservationById);
router.patch('/:id/cancel', requireAuth, cancelMyReservation);

// ─── Admin routes ──────────────────────────────────────────────────────────
router.get('/admin/all', requireAuth, requireRole('ADMIN'), validate(reservationQuerySchema, 'query'), adminGetAllReservations);
router.post('/admin', requireAuth, requireRole('ADMIN'), validate(adminCreateReservationSchema), adminCreateReservation);
router.patch('/admin/:id', requireAuth, requireRole('ADMIN'), validate(adminUpdateReservationSchema), adminUpdateReservation);
router.delete('/admin/:id', requireAuth, requireRole('ADMIN'), adminDeleteReservation);

export default router;
