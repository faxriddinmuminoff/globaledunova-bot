import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
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
