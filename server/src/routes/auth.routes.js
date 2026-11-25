import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as c from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// не больше 10 попыток входа за 15 минут с одного адреса
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ error: { code: 'TOO_MANY_ATTEMPTS', message: 'Слишком много попыток входа, попробуйте позже' } }),
});

export const authRoutes = Router();
authRoutes.post('/login', loginLimiter, asyncHandler(c.login));
authRoutes.get('/me', authenticate, asyncHandler(c.me));
