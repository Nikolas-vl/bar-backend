import { z } from 'zod';

export const createTableSchema = z.object({
  number: z.number().int().positive(),
  capacity: z.number().int().min(1),
});

export const updateTableSchema = createTableSchema.partial();

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
