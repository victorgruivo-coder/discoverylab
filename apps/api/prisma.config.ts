import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 no longer reads .env on its own, and the datasource url may not
 * live in schema.prisma, so both are wired up here. Node's builtin
 * loadEnvFile keeps the dependency list unchanged (no dotenv).
 */
try {
  loadEnvFile(fileURLToPath(new URL('.env', import.meta.url)));
} catch {
  // No .env file: rely on the ambient environment (CI, docker, prod).
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
