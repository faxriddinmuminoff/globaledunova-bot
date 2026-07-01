import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z
  .object({
    BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL').optional(),
    NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    MANAGER_USERNAME: z.string().optional(),
    ADMIN_TELEGRAM_IDS: z.string().optional().default(''),
    MANAGER_CHAT_ID: z.string().optional(),
    HEALTH_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60_000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).default(30),
    DEFAULT_STORAGE_PROVIDER: z.enum(['telegram', 'local', 's3']).default('telegram'),
    LOCAL_STORAGE_DIR: z.string().default('./uploads'),
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().default('us-east-1'),
    S3_ENDPOINT: z.string().url().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_PUBLIC_BASE_URL: z.string().url().optional(),
    BACKUP_DIR: z.string().default('./backups'),
    SOFT_LAUNCH_MODE: z
      .string()
      .optional()
      .default('false')
      .transform((v) => v === 'true' || v === '1'),
    SOFT_LAUNCH_WHITELIST: z.string().optional().default(''),
    SOFT_LAUNCH_MAX_APPLICATIONS: z.coerce.number().int().min(1).default(1),
    SOFT_LAUNCH_TEST_NOTIFICATIONS: z
      .string()
      .optional()
      .default('false')
      .transform((v) => v === 'true' || v === '1'),
    STAGING_FAKE_NOTIFICATIONS: z
      .string()
      .optional()
      .default('false')
      .transform((v) => v === 'true' || v === '1'),
    STAGING_FAKE_MANAGER_ALERTS: z
      .string()
      .optional()
      .default('false')
      .transform((v) => v === 'true' || v === '1'),
    QUEUE_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(5),
    QUEUE_CIRCUIT_BREAKER_FAILURES: z.coerce.number().int().min(1).default(10),
    QUEUE_STALLED_AFTER_MS: z.coerce.number().int().min(60_000).default(15 * 60_000),
    SESSION_TTL_MS: z.coerce.number().int().min(60_000).default(24 * 60 * 60_000),
    UPLOAD_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30_000),
    TELEGRAM_SEND_TIMEOUT_MS: z.coerce.number().int().min(1000).default(10_000),
  })
  .refine((data) => data.NODE_ENV !== 'production' || !!data.DATABASE_URL, {
    message: 'DATABASE_URL is required in production',
    path: ['DATABASE_URL'],
  })
  .refine(
    (data) => data.DEFAULT_STORAGE_PROVIDER !== 's3' || !!data.S3_BUCKET,
    { message: 'S3_BUCKET is required when DEFAULT_STORAGE_PROVIDER=s3', path: ['S3_BUCKET'] },
  );

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;

export const adminTelegramIds: number[] = config.ADMIN_TELEGRAM_IDS.split(',')
  .map((id) => id.trim())
  .filter(Boolean)
  .map((id) => Number(id))
  .filter((id) => Number.isInteger(id) && id > 0);

export const softLaunchWhitelist: number[] = config.SOFT_LAUNCH_WHITELIST.split(',')
  .map((id) => id.trim())
  .filter(Boolean)
  .map((id) => Number(id))
  .filter((id) => Number.isInteger(id) && id > 0);

export const isSoftLaunchMode = config.SOFT_LAUNCH_MODE;

export const managerChatId: number | undefined = (() => {
  const raw = config.MANAGER_CHAT_ID?.trim();
  if (!raw) return undefined;
  const id = Number(raw);
  return Number.isInteger(id) ? id : undefined;
})();

export const isProduction = config.NODE_ENV === 'production';
export const isStaging = config.NODE_ENV === 'staging';
export const isDevelopment = config.NODE_ENV === 'development';
