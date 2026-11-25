import { Router } from 'express';
import * as c from '../controllers/orders.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

// права на смену статуса и оплаты зависят от состояния заказа,
// поэтому их проверяет сервисный слой (BR-13, BR-26), а не только роут
export const ordersRoutes = Router();
ordersRoutes.use(authenticate);
ordersRoutes.get('/', h(c.list));
ordersRoutes.post('/', h(c.create));
ordersRoutes.get('/:id', h(c.getById));
ordersRoutes.patch('/:id', h(c.update));
ordersRoutes.post('/:id/status', h(c.changeStatus));
ordersRoutes.post('/:id/payment', h(c.changePayment));
ordersRoutes.post('/:id/rework', h(c.rework));
ordersRoutes.get('/:id/events', h(c.events));
