import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import prisma from '../../prisma';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import { updateRefreshToken } from './auth.service';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import redis from '../../lib/redis/redis.client';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_AUTH_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_AUTH_CLIENT_SECRET!;
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.BACKEND_PORT || 4000}`;
const GOOGLE_REDIRECT_URI = `${BACKEND_URL}/auth/google/callback`;

const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);

// Generates a Google OAuth URL and stores a CSRF state token in Redis (TTL 10 min)
export const getGoogleAuthUrl = async (): Promise<string> => {
  const state = randomUUID();
  // Store state in Redis — verified atomically on callback, then deleted
  await redis.set(`oauth:state:${state}`, '1', 'EX', 600);

  return oauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    prompt: 'consent',
    state,
  });
};

export const handleGoogleCallback = async (code: string) => {
  const { tokens } = await oauthClient.getToken(code);

  if (!tokens.id_token) {
    throw new AppError('Google authentication failed: no ID token', 400);
  }

  const ticket = await oauthClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.email) {
    throw new AppError('Google authentication failed: invalid token payload', 400);
  }

  const { email, name, sub: googleId } = payload;

  logger.info({ email, googleId }, 'Google OAuth profile received');

  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, provider: 'google' },
      });
      logger.info({ userId: user.id }, 'Linked Google account to existing user');
    }
  } else {
    user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        provider: 'google',
        googleId,
      },
    });
    logger.info({ userId: user.id }, 'Created new user via Google OAuth');
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  const hashedRefresh = await bcrypt.hash(refreshToken, 10);

  await updateRefreshToken(user.id, hashedRefresh);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};
