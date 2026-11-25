import { http, qs } from './http.js';

export const listOrders = (params) => http('GET', '/orders' + qs(params));
export const getOrder = (id) => http('GET', `/orders/${id}`);
export const createOrder = (data) => http('POST', '/orders', data);
export const updateOrder = (id, data) => http('PATCH', `/orders/${id}`, data);
export const changeStatus = (id, status, reason) => http('POST', `/orders/${id}/status`, { status, reason });
export const changePayment = (id, paymentStatus) => http('POST', `/orders/${id}/payment`, { paymentStatus });
export const createRework = (id, reason) => http('POST', `/orders/${id}/rework`, reason ? { reason } : {});
export const getEvents = (id) => http('GET', `/orders/${id}/events`);
