import { Router } from 'express';
import * as c from '../controllers/stats.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

export const statsRoutes = Router();
statsRoutes.use(authenticate, requireRole('ADMIN'));
statsRoutes.get('/overview', h(c.overview));
