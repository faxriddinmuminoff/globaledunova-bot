export type BroadcastStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';

export interface BroadcastFilters {
  allUsers?: boolean;
  country?: string;
  universityId?: string;
  applicationStatus?: string;
  language?: string;
  registeredAfter?: string;
}

export interface BroadcastCampaign {
  id: number;
  title: string;
  message: string;
  filters: BroadcastFilters;
  status: BroadcastStatus;
  scheduled_at: Date | null;
  sent_count: number;
  total_targets: number;
  created_by: number;
  cancelled_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
}

export interface CreateBroadcastInput {
  title: string;
  message: string;
  filters: BroadcastFilters;
  createdBy: number;
  scheduledAt?: Date | null;
}
