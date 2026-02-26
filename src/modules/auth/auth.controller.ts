import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { createUser, findUserByEmail, updateRefreshToken, findUserByRefreshToken } from './auth.service';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from './jwt';

const isProd = process.env.NODE_ENV === 'production';

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  req.log.info({ email }, 'Register attempt');
  const existing = await findUserByEmail(email);

  if (existing) {
    req.log.warn({ email }, 'User already exists');
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await createUser(email, password);
  req.log.info({ userId: user.id }, 'User registered');

  res.status(201).json({
    id: user.id,
    email: user.email,
  });
};

export const login = async (req: Request, res: Response) => {
  const { email } = req.body;

  req.log.info({ email }, 'Login attempt');

  const user = await findUserByEmail(email);
  if (!user) {
    req.log.warn({ email }, 'Login failed: user not found');
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(req.body.password, user.password);
  if (!isValid) {
    req.log.warn({ userId: user.id }, 'Login failed: wrong password');
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  await updateRefreshToken(user.id, refreshToken);

  req.log.info({ userId: user.id }, 'User logged in');

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken });
};

export const refresh = async (req: Request, res: Response) => {
  const oldRefreshToken = req.cookies.refreshToken;

  if (!oldRefreshToken) {
    req.log.warn('No refresh token in cookies');
    return res.status(401).json({ message: 'No refresh token' });
  }

  try {
    const payload = verifyRefreshToken(oldRefreshToken) as { userId: number };

    const user = await findUserByRefreshToken(oldRefreshToken);

    if (!user) {
      req.log.error({ userId: payload.userId }, 'Refresh token reuse detected. Session compromised.');

      await updateRefreshToken(payload.userId, null);

      return res.status(401).json({ message: 'Session compromised' });
    }

    if (user.id !== payload.userId) {
      req.log.error({ tokenUserId: payload.userId, dbUserId: user.id }, 'Refresh token payload mismatch');

      await updateRefreshToken(user.id, null);

      return res.status(401).json({ message: 'Session compromised' });
    }

    const newAccessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    await updateRefreshToken(user.id, newRefreshToken);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken: newAccessToken });
  } catch {
    req.log.warn('Invalid refresh token signature');
    return res.status(401).json({ message: 'Invalid refresh token' });
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
