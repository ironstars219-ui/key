import { http, qs } from './http.js';

export const listClients = (params) => http('GET', '/clients' + qs(params));
export const getClient = (id) => http('GET', `/clients/${id}`);
export const createClient = (data) => http('POST', '/clients', data);
export const updateClient = (id, data) => http('PATCH', `/clients/${id}`, data);
