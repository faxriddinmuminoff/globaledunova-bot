export type ActivityAction =
  | 'user_registered'
  | 'application_created'
  | 'document_uploaded'
  | 'document_verified'
  | 'document_rejected'
  | 'status_changed'
  | 'requirement_updated';

export interface ActivityLog {
  id: number;
  telegram_id: number | null;
  actor_telegram_id: number | null;
  action: ActivityAction;
  entity_type: string | null;
  entity_id: number | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}
