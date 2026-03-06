import { Request, Response } from 'express';
import { registerUser, loginUser, refreshSession, findUserByRefreshToken, updateRefreshToken } from './auth.service';
import { UnauthorizedError } from '../../utils/errors';

const isProd = process.env.NODE_ENV === 'production';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ('strict' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req: Request, res: Response) => {
  req.log.info({ email: req.body.email }, 'Register attempt');

  const user = await registerUser(req.body);

  req.log.info({ userId: user.id }, 'User registered');
  res.status(201).json(user);
};

export const login = async (req: Request, res: Response) => {
  req.log.info({ email: req.body.email }, 'Login attempt');

  const { accessToken, refreshToken } = await loginUser(req.body);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  res.json({ accessToken });
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
    const user = await findUserByRefreshToken(refreshToken);
    if (user) {
      await updateRefreshToken(user.id, null);
      req.log.info({ userId: user.id }, 'User logged out');
    }
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'none',
  });

  res.json({ message: 'User successfully logged out' });
};
