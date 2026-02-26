import bcrypt from 'bcrypt';
import { Response, Request } from 'express';
import { getUserById, updateUser } from './user.service';

export const getMyProfile = async (req: Request, res: Response) => {
  const user = await getUserById(req.userId!);
  if (!user) return res.status(404).json({ message: 'User not found' });

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
};

export const updateMyProfile = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { name, password } = req.body;

  const data: Record<string, string> = {};
  if (name) data.name = name;
  if (password) data.password = await bcrypt.hash(password, 10);

  const user = await updateUser(userId, data);

  res.json({ id: user.id, email: user.email, name: user.name });
};
