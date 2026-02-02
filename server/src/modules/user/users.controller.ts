import { Response, Request } from 'express';
import { getUserById, updateUser } from './users.service';
import bcrypt from 'bcrypt';
import { AuthenticatedRequest } from '../../middlewares/auth';

export const getMyProfile = async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;

  const user = await getUserById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
};

export const updateMyProfile = async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest;
  const { name, password } = req.body;

  const data: any = {};
  if (name) data.name = name;
  if (password) data.password = await bcrypt.hash(password, 10);

  const user = await updateUser(userId, data);

  res.json({ id: user.id, email: user.email, name: user.name });
};
