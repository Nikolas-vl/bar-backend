import { Request, Response } from 'express';
import { registerUser, loginUser, refreshSession, updateRefreshToken } from './auth.service';
import { UnauthorizedError } from '../../utils/errors';
import { verifyRefreshToken } from '../../utils/jwt';

const isProd = process.env.NODE_ENV === 'production';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ('strict' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth/refresh',
};

export const register = async (req: Request, res: Response) => {
  req.log.info({ email: req.body.email }, 'Register attempt');

  const { user, accessToken, refreshToken } = await registerUser(req.body);

  req.log.info({ userId: user.id }, 'User registered');
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(201).json({ user, accessToken });
};

export const login = async (req: Request, res: Response) => {
  req.log.info({ email: req.body.email }, 'Login attempt');

  const { user, accessToken, refreshToken } = await loginUser(req.body);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  res.json({ user, accessToken });
};

export const refresh = async (req: Request, res: Response) => {
  const oldRefreshToken = req.cookies.refreshToken;

  if (!oldRefreshToken) {
    throw new UnauthorizedError('No refresh token');
  }

  try {
    const { accessToken, refreshToken } = await refreshSession(oldRefreshToken);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ accessToken });
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken) as { userId: number };

      await updateRefreshToken(payload.userId, null);

      req.log.info({ userId: payload.userId }, 'User logged out');
    } catch {
      req.log.warn('Invalid refresh token during logout');
    }
  }

  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);

  res.json({ message: 'User successfully logged out' });
};
