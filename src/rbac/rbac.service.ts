import { getStorageBackend } from '../database/storage';
import { query, queryOne } from '../database/index';
import { adminTelegramIds } from '../config';
import { AdminRole, AdminUser, Permission, ROLE_PERMISSIONS } from './types';

const adminCache = new Set<number>();

interface AdminUserRow {
  telegram_id: string;
  role: AdminRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const memoryAdmins = new Map<number, AdminUser>();

function mapRow(row: AdminUserRow): AdminUser {
  return {
    telegram_id: Number(row.telegram_id),
    role: row.role,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function seedAdminUsersFromEnv(): Promise<void> {
  for (const telegramId of adminTelegramIds) {
    adminCache.add(telegramId);
    await upsertAdminUser(telegramId, 'super_admin');
  }
}

export async function refreshAdminCache(): Promise<void> {
  adminCache.clear();
  for (const telegramId of adminTelegramIds) {
    adminCache.add(telegramId);
  }

  if (getStorageBackend() === 'postgres') {
    const rows = await query<{ telegram_id: string }>(
      `SELECT telegram_id FROM admin_users WHERE is_active = TRUE`,
    );
    for (const row of rows) {
      adminCache.add(Number(row.telegram_id));
    }
  } else {
    for (const id of memoryAdmins.keys()) {
      adminCache.add(id);
    }
  }
}

export async function upsertAdminUser(
  telegramId: number,
  role: AdminRole,
): Promise<AdminUser> {
  if (getStorageBackend() === 'postgres') {
    const row = await queryOne<AdminUserRow>(
      `INSERT INTO admin_users (telegram_id, role, is_active)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (telegram_id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW()
       RETURNING *`,
      [telegramId, role],
    );
    if (!row) throw new Error('Failed to upsert admin user');
    return mapRow(row);
  }

  const user: AdminUser = {
    telegram_id: telegramId,
    role,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };
  memoryAdmins.set(telegramId, user);
  adminCache.add(telegramId);
  return { ...user };
}

export async function findAdminUser(telegramId: number): Promise<AdminUser | null> {
  if (getStorageBackend() === 'postgres') {
    const row = await queryOne<AdminUserRow>(
      `SELECT * FROM admin_users WHERE telegram_id = $1 AND is_active = TRUE`,
      [telegramId],
    );
    return row ? mapRow(row) : null;
  }

  const user = memoryAdmins.get(telegramId);
  return user?.is_active ? { ...user } : null;
}

export function isAdminSync(telegramId: number | undefined): boolean {
  if (!telegramId) return false;
  return adminCache.has(telegramId);
}

export async function isAdminUser(telegramId: number | undefined): Promise<boolean> {
  if (!telegramId) return false;
  if (adminCache.has(telegramId)) return true;
  const user = await findAdminUser(telegramId);
  if (user) adminCache.add(telegramId);
  return user !== null;
}

export async function hasPermission(
  telegramId: number | undefined,
  permission: Permission,
): Promise<boolean> {
  if (!telegramId) return false;

  let role: AdminRole | null = null;

  if (adminTelegramIds.includes(telegramId)) {
    role = 'super_admin';
  } else {
    const user = await findAdminUser(telegramId);
    role = user?.role ?? null;
  }

  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function clearMemoryAdminsForTests(): void {
  memoryAdmins.clear();
  adminCache.clear();
}
