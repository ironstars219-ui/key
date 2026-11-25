import 'dotenv/config';

function need(name) {
  const value = process.env[name];
  if (!value) throw new Error(`В .env не задана переменная ${name}`);
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  databaseUrl: need('DATABASE_URL'),
  jwtSecret: need('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
