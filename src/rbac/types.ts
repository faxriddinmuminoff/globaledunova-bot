export type AdminRole = 'super_admin' | 'manager' | 'reviewer' | 'support';

export type Permission =
  | 'applications:view'
  | 'applications:update'
  | 'documents:view'
  | 'documents:verify'
  | 'statistics:view'
  | 'broadcast:send'
  | 'settings:update'
  | 'universities:manage'
  | 'backup:view'
  | 'queue:manage';

export interface AdminUser {
  telegram_id: number;
  role: AdminRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    'applications:view',
    'applications:update',
    'documents:view',
    'documents:verify',
    'statistics:view',
    'broadcast:send',
    'settings:update',
    'universities:manage',
    'backup:view',
    'queue:manage',
  ],
  manager: [
    'applications:view',
    'applications:update',
    'documents:view',
    'documents:verify',
    'statistics:view',
    'broadcast:send',
    'backup:view',
    'queue:manage',
  ],
  reviewer: ['applications:view', 'documents:view'],
  support: ['applications:view', 'documents:view', 'statistics:view'],
};
