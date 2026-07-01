import { describe, it, expect } from 'vitest';
import { useFreshMemoryStorage } from '../helpers/test-storage';
import { runReleaseReadinessReport } from '../../src/observability/release-readiness.service';

describe('release readiness service', () => {
  useFreshMemoryStorage();

  it('returns structured readiness report', async () => {
    const report = await runReleaseReadinessReport();
    expect(report.checks.some((c) => c.name === 'Database')).toBe(true);
    expect(['PRODUCTION READY', 'PRODUCTION BLOCKED']).toContain(report.status);
  });
});
