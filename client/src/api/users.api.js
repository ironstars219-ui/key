import { http, qs } from './http.js';

export const listUsers = (params) => http('GET', '/users' + qs({ pageSize: 100, ...params }));
export const createUser = (data) => http('POST', '/users', data);
export const updateUser = (id, data) => http('PATCH', `/users/${id}`, data);
