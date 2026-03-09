import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { requireAuth } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/role.middleware';
import { createTableSchema, updateTableSchema } from './table.schema';
import { getAllTables, createTable, updateTable, deleteTable } from './table.controller';

const router = Router();

router.get('/', getAllTables);
router.post('/', requireAuth, requireRole('ADMIN'), validate(createTableSchema), createTable);
router.patch('/:id', requireAuth, requireRole('ADMIN'), validate(updateTableSchema), updateTable);
router.delete('/:id', requireAuth, requireRole('ADMIN'), deleteTable);

export default router;
