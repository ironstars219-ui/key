import * as service from '../services/clients.service.js';
import { readPaging } from '../utils/pagination.js';
import { idParam } from '../validators/common.js';
import { createClientInput, updateClientInput } from '../validators/clients.validator.js';

export const list = async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  res.json(await service.list({ search, ...readPaging(req.query) }));
};
export const getById = async (req, res) => res.json(await service.getById(idParam(req.params.id)));
export const create = async (req, res) => res.status(201).json(await service.create(createClientInput(req.body)));
export const update = async (req, res) =>
  res.json(await service.update(idParam(req.params.id), updateClientInput(req.body)));
