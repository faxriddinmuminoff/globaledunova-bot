import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z
  .object({
    BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL').optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    MANAGER_USERNAME: z.string().optional(),
  })
  .refine((data) => data.NODE_ENV !== 'production' || !!data.DATABASE_URL, {
    message: 'DATABASE_URL is required in production',
    path: ['DATABASE_URL'],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;

export const isProduction = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';
