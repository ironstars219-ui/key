import * as service from '../services/stats.service.js';

export const overview = async (req, res) =>
  res.json(await service.overview({ from: req.query.from, to: req.query.to }));
