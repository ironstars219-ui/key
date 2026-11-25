import * as service from '../services/services.service.js';
import { forbidden } from '../utils/AppError.js';
import { idParam } from '../validators/common.js';
import { createServiceInput, updateServiceInput } from '../validators/services.validator.js';

export const list = async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  // неактивные услуги видит только администратор
  if (includeInactive && req.user.role !== 'ADMIN') throw forbidden('Отключённые услуги видит только администратор');
  res.json(await service.list({ includeInactive }));
};
export const create = async (req, res) => res.status(201).json(await service.create(createServiceInput(req.body)));
export const update = async (req, res) =>
  res.json(await service.update(idParam(req.params.id), updateServiceInput(req.body)));
