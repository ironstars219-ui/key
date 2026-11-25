import { PrismaClient } from '@prisma/client';

// один общий клиент на всё приложение
export const prisma = new PrismaClient();
