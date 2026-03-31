import { Router } from 'express';
import { register, login, refresh, logout, googleRedirect, googleCallback } from './auth.controller';
import { validate } from '../../middlewares/validate';
import { registerSchema, loginSchema } from './auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

router.post('/refresh', refresh);
router.post('/logout', logout);

router.get('/google', googleRedirect);
router.get('/google/callback', googleCallback);

export default router;
