import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Test defaults so a suite that imports `src/config` (directly or through the
    // logger) does not depend on a developer's local .env file. Real secrets are
    // never needed here: no test talks to Telegram or to the platform.
    env: {
      NODE_ENV: 'test',
      BOT_TOKEN: 'test-bot-token',
      LOG_LEVEL: 'fatal',
      // Keep any file a test writes out of the real data/upload directories: the
      // handler suite exercises the production charter path, which would otherwise
      // drop PDFs into ./uploads and get them committed.
      DATA_DIR: './.test-tmp/data',
      LOCAL_STORAGE_DIR: './.test-tmp/uploads',
    },
    coverage: {
      provider: 'v8',
      include: [
        'src/services/admin-*.ts',
        'src/services/application-*.ts',
        'src/services/soft-launch.service.ts',
        'src/services/search.service.ts',
        'src/services/reminder.service.ts',
        'src/services/requirement.service.ts',
        'src/services/activity-log.service.ts',
        'src/database/repositories/**/*.ts',
        'src/database/stores/memory-*.ts',
        'src/audit/**/*.ts',
        'src/broadcast/**/*.ts',
        'src/settings/**/*.ts',
        'src/rbac/**/*.ts',
        'src/queue/memory-*.ts',
        'src/queue/queue.factory.ts',
        'src/admin/formatters.ts',
        'src/types/pagination.ts',
      ],
      exclude: ['src/**/*.d.ts'],
      thresholds: {
        lines: 70,
        statements: 65,
        functions: 65,
        branches: 50,
      },
    },
  },
});
