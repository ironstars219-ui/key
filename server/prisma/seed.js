// Первый администратор и начальный справочник услуг.
// Запуск: npm run db:seed (повторный запуск ничего не дублирует).
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SERVICES = [
  { name: 'Дубликат обычного ключа', price: 800 },
  { name: 'Дубликат автомобильного ключа', price: 6500 },
  { name: 'Ремонт ключа', price: 1200 },
  { name: 'Программирование домофонного ключа', price: 1500 },
];

async function main() {
  const login = process.env.SEED_ADMIN_LOGIN || 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error('Задайте SEED_ADMIN_PASSWORD (минимум 8 символов) в .env');
  }

  const exists = await prisma.user.findUnique({ where: { login } });
  if (!exists) {
    await prisma.user.create({
      data: {
        fullName: 'Администратор',
        login,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'ADMIN',
      },
    });
    console.log(`Создан администратор «${login}»`);
  } else {
    console.log(`Администратор «${login}» уже есть`);
  }

  for (const s of SERVICES) {
    // цену существующей услуги не трогаем: её меняет только администратор
    await prisma.service.upsert({ where: { name: s.name }, update: {}, create: s });
  }
  console.log('Справочник услуг готов');
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
