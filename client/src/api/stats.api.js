import { http, qs } from './http.js';

export const getOverview = (params) => http('GET', '/stats/overview' + qs(params));
