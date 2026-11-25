import { forbidden } from '../utils/AppError.js';

// requireRole('ADMIN') — пускает только администратора
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(forbidden('Недостаточно прав для этого действия'));
  }
  next();
};
