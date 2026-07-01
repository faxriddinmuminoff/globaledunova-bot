import { getJobQueue } from './queue.factory';
import { getQueueThroughputPerMinute } from '../observability/metrics';
import { isQueueCircuitOpen } from './job-processor';

export interface QueueOperationalHealth {
  pending: number;
  processing: number;
  failed: number;
  deadLetter: number;
  throughputPerMinute: number;
  circuitOpen: boolean;
}

export async function getQueueOperationalHealth(): Promise<QueueOperationalHealth> {
  const queue = getJobQueue();
  const [pending, processing, failed, deadLetter] = await Promise.all([
    queue.countByStatus('pending'),
    queue.countByStatus('processing'),
    queue.countByStatus('failed'),
    queue.countByStatus('dead'),
  ]);

  return {
    pending,
    processing,
    failed,
    deadLetter,
    throughputPerMinute: getQueueThroughputPerMinute(),
    circuitOpen: isQueueCircuitOpen(),
  };
}

export async function retryQueueJob(id: number): Promise<boolean> {
  return getJobQueue().retry?.(id) ?? false;
}

export async function ignoreQueueJob(id: number): Promise<boolean> {
  return getJobQueue().ignore?.(id) ?? false;
}
