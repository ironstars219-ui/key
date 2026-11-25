import { Router } from 'express';
import * as c from '../controllers/services.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

export const servicesRoutes = Router();
servicesRoutes.use(authenticate);
servicesRoutes.get('/', h(c.list));
servicesRoutes.post('/', requireRole('ADMIN'), h(c.create));
servicesRoutes.patch('/:id', requireRole('ADMIN'), h(c.update));
