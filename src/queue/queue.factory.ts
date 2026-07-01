import { getStorageBackend } from '../database/storage';
import { MemoryJobQueue } from './memory-job-queue';
import { JobQueue } from './job-queue.interface';
import { PostgresJobQueue } from './postgres-job-queue';

let queue: JobQueue | null = null;

export function getJobQueue(): JobQueue {
  if (!queue) {
    queue = getStorageBackend() === 'postgres' ? new PostgresJobQueue() : new MemoryJobQueue();
  }
  return queue;
}

export function resetJobQueueForTests(): void {
  queue = null;
}
