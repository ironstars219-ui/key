import { http, qs } from './http.js';

export const listServices = (params) => http('GET', '/services' + qs(params));
export const createService = (data) => http('POST', '/services', data);
export const updateService = (id, data) => http('PATCH', `/services/${id}`, data);
