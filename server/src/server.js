import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './database/prisma.js';

const server = app.listen(env.port, () => {
  console.log(`КлючУчёт: сервер запущен на http://localhost:${env.port}`);
});

// аккуратно закрываем соединение с БД при остановке
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}
