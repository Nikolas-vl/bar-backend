import { z } from 'zod';

export const positiveInt = z.coerce.number().int().positive();

export const paramSchema = <K extends string>(...keys: K[]) => {
  const shape = {} as Record<K, typeof positiveInt>;
  for (const key of keys) {
    shape[key] = positiveInt;
  }
  return z.object(shape);
};
