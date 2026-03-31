import { Request, Response } from 'express';
import { paramSchema } from '../../utils/common.schema';
import * as service from './user.service';
import { userQuerySchema } from './user.schema';

// ─── User ──────────────────────────────────────────────────────────────────

export const getMyProfile = async (req: Request, res: Response) => {
  const userId = req.userId!;
  req.log.info({ userId }, 'Fetching own profile');

  const user = await service.getUserById(userId);

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
  });
};

export const updateMyProfile = async (req: Request, res: Response) => {
  const userId = req.userId!;
  req.log.info({ userId }, 'Updating own profile');

  const user = await service.updateUser(userId, req.body);

  req.log.info({ userId }, 'Profile updated');
  res.json(user);
};

// ─── Admin ─────────────────────────────────────────────────────────────────

export const adminGetAllUsers = async (req: Request, res: Response) => {
  const query = userQuerySchema.parse(req.query);
  req.log.info({ query }, 'Admin fetching all users');

  const result = await service.getAllUsers(query);
  res.json(result);
};

export const adminGetUserById = async (req: Request, res: Response) => {
  const { userId } = paramSchema('userId').parse(req.params);
  req.log.info({ userId }, 'Admin fetching user');

  const user = await service.getUserById(userId);
  const activeOrdersCount = await service.getActiveOrdersCount(userId);

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    activeOrdersCount,
  });
};

export const adminUpdateUserHandler = async (req: Request, res: Response) => {
  const { userId } = paramSchema('userId').parse(req.params);
  req.log.info({ userId, body: req.body }, 'Admin updating user');

  const user = await service.adminUpdateUser(userId, req.body);

  req.log.info({ userId, role: user.role }, 'User updated');
  res.json(user);
};

export const adminDeleteUser = async (req: Request, res: Response) => {
  const { userId } = paramSchema('userId').parse(req.params);
  req.log.info({ userId }, 'Admin deleting user');

  await service.deleteUser(userId);

  req.log.info({ userId }, 'User deleted');
  res.status(204).end();
};
