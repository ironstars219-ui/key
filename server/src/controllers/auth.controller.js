import * as authService from '../services/auth.service.js';
import { loginInput } from '../validators/auth.validator.js';

export const login = async (req, res) => res.json(await authService.login(loginInput(req.body)));

export const me = async (req, res) => res.json({ user: authService.publicUser(req.user) });
