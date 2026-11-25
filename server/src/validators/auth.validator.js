import { readBody, str } from './common.js';

export function loginInput(body) {
  const b = readBody(body, ['login', 'password']);
  return { login: str(b.login, 'login', { max: 50 }), password: str(b.password, 'password', { max: 200 }) };
}
