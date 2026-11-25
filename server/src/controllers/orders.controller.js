import * as service from '../services/orders.service.js';
import { readPaging } from '../utils/pagination.js';
import { idParam } from '../validators/common.js';
import {
  createOrderInput, updateOrderInput, statusInput, paymentInput, reworkInput, orderListQuery,
} from '../validators/orders.validator.js';

export const list = async (req, res) => res.json(await service.list(orderListQuery(req.query), readPaging(req.query)));
export const getById = async (req, res) => res.json(await service.getById(idParam(req.params.id)));
export const create = async (req, res) =>
  res.status(201).json(await service.create(createOrderInput(req.body), req.user));
export const update = async (req, res) =>
  res.json(await service.update(idParam(req.params.id), updateOrderInput(req.body), req.user));
export const changeStatus = async (req, res) =>
  res.json(await service.changeStatus(idParam(req.params.id), statusInput(req.body), req.user));
export const changePayment = async (req, res) =>
  res.json(await service.changePayment(idParam(req.params.id), paymentInput(req.body), req.user));
export const rework = async (req, res) =>
  res.status(201).json(await service.rework(idParam(req.params.id), reworkInput(req.body), req.user));
export const events = async (req, res) => res.json(await service.events(idParam(req.params.id)));
