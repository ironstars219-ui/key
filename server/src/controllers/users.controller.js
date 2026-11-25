import * as service from '../services/users.service.js';
import { readPaging } from '../utils/pagination.js';
import { idParam } from '../validators/common.js';
import { createUserInput, updateUserInput } from '../validators/users.validator.js';

export const list = async (req, res) => res.json(await service.list(readPaging(req.query)));
export const create = async (req, res) => res.status(201).json(await service.create(createUserInput(req.body)));
export const update = async (req, res) =>
  res.json(await service.update(idParam(req.params.id), updateUserInput(req.body), req.user));
