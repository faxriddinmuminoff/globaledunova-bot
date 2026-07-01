import { EnqueueJobInput, JobRecord } from './types';

export interface JobQueue {
  enqueue(input: EnqueueJobInput): Promise<JobRecord>;
  claimNext(limit?: number): Promise<JobRecord[]>;
  recoverStalled?(stalledAfterMs?: number): Promise<number>;
  complete(id: number): Promise<void>;
  fail(id: number, error: string): Promise<void>;
  moveToDeadLetter(id: number, error: string): Promise<void>;
  countByStatus(status: string): Promise<number>;
  listRecentFailures?(limit?: number): Promise<JobRecord[]>;
  retry?(id: number): Promise<boolean>;
  ignore?(id: number): Promise<boolean>;
}
