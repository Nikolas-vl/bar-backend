import { Response, Request } from 'express';
import { getUserById, updateUser } from './user.service';

export const getMyProfile = async (req: Request, res: Response) => {
  const user = await getUserById(req.userId!);

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
};

export const updateMyProfile = async (req: Request, res: Response) => {
  const userId = req.userId!;

  const user = await updateUser(userId, req.body);

  res.json({ id: user.id, email: user.email, name: user.name });
};
