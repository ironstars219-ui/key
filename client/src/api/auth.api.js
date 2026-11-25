import { http } from './http.js';

export const login = (login, password) => http('POST', '/auth/login', { login, password });
export const me = () => http('GET', '/auth/me');
