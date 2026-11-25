import { Router } from 'express';
import * as c from '../controllers/users.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

export const usersRoutes = Router();
usersRoutes.use(authenticate, requireRole('ADMIN'));
usersRoutes.get('/', h(c.list));
usersRoutes.post('/', h(c.create));
usersRoutes.patch('/:id', h(c.update));
