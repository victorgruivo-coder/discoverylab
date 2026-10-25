import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  WEB_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});

type Env = z.infer<typeof envSchema>;

/**
 * Node 22 loads .env natively, so no dotenv. A missing file is not fatal:
 * prod and CI provide the variables directly in the environment.
 */
function loadDotEnv(): void {
  try {
    loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)));
  } catch {
    // No .env file present; the ambient environment is the source of truth.
  }
}

function readEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return parsed.data;
}

// Validated at import time: a bad environment throws before the server binds.
loadDotEnv();

export const config = Object.freeze(readEnv());

/** Compare against these instead of NODE_ENV directly (M5 cookie flags). */
export const isProduction = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';

/**
 * Session cookie flags that vary by environment. In production the web app and
 * `/api` share one origin behind Nginx, so `Lax` is sufficient and avoids
 * third-party-cookie blocking. `Secure` is still required because the public
 * origin is HTTPS (Nginx terminates TLS).
 */
export const sessionCookieFlags = Object.freeze({
  sameSite: 'lax' as const,
  secure: isProduction,
});
