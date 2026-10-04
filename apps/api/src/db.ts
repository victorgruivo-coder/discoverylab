import { PrismaPg } from '@prisma/adapter-pg';

import { config } from './config.js';
import { PrismaClient } from './generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: config.DATABASE_URL });

/** Single client for the process; the pg pool lives inside the adapter. */
export const db = new PrismaClient({ adapter });

export async function disconnect(): Promise<void> {
  await db.$disconnect();
}
