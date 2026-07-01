import { isAdminSync } from '../../rbac/rbac.service';

export function isAdmin(telegramId: number | undefined): boolean {
  return isAdminSync(telegramId);
}
