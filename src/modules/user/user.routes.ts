import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { requireRole } from '../../middlewares/role.middleware';
import { updateProfileSchema, adminUpdateUserSchema, userQuerySchema } from './user.schema';
import { getMyProfile, updateMyProfile, adminGetAllUsers, adminGetUserById, adminUpdateUserHandler, adminDeleteUser } from './user.controller';

const router = Router();

// ─── User routes ───────────────────────────────────────────────────────────
router.get('/profile', getMyProfile);
router.patch('/profile', validate(updateProfileSchema), updateMyProfile);

// ─── Admin routes ──────────────────────────────────────────────────────────
router.get('/admin/all', requireRole('ADMIN'), validate(userQuerySchema, 'query'), adminGetAllUsers);
router.get('/admin/:userId', requireRole('ADMIN'), adminGetUserById);
router.patch('/admin/:userId', requireRole('ADMIN'), validate(adminUpdateUserSchema), adminUpdateUserHandler);
router.delete('/admin/:userId', requireRole('ADMIN'), adminDeleteUser);

export default router;
