import { Router } from 'express';
import * as c from '../controllers/clients.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

export const clientsRoutes = Router();
clientsRoutes.use(authenticate);
clientsRoutes.get('/', h(c.list));
clientsRoutes.post('/', h(c.create));
clientsRoutes.get('/:id', h(c.getById));
clientsRoutes.patch('/:id', h(c.update));
