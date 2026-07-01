import { AdminSearchMode } from '../admin/types';
import { User } from '../types';
import { ApplicationWithStudent } from '../admin/types';
import { PaginatedResult } from '../types/requirements';
import {
  searchUsersPaginated,
  searchApplicationsPaginated,
  AdminSearchType,
} from './search.service';
import { formatApplicationSummary } from '../admin/formatters';
import { Language } from '../types';
import { t } from '../i18n';

export const ADMIN_SEARCH_PAGE_SIZE = 20;

const USER_MODES: AdminSearchMode[] = ['phone', 'telegram_id', 'name'];

export function isUserSearchMode(mode: AdminSearchMode): boolean {
  return USER_MODES.includes(mode);
}

export async function executeAdminSearch(
  mode: AdminSearchMode,
  query: string,
  page: number,
): Promise<PaginatedResult<User> | PaginatedResult<ApplicationWithStudent>> {
  if (isUserSearchMode(mode)) {
    return searchUsersPaginated(
      mode as 'phone' | 'telegram_id' | 'name',
      query,
      page,
      ADMIN_SEARCH_PAGE_SIZE,
    );
  }

  return searchApplicationsPaginated({
    type: mode as AdminSearchType,
    query,
    page,
    pageSize: ADMIN_SEARCH_PAGE_SIZE,
  });
}

export function formatUserSearchResults(
  language: Language,
  results: User[],
  paginated: PaginatedResult<User>,
): string {
  const texts = t(language);
  if (results.length === 0) return texts.adminSearchNoResults;

  const entries = results
    .map(
      (user, index) =>
        `*${index + 1 + (paginated.page - 1) * paginated.pageSize}.* ${user.full_name ?? '—'}\n📱 ${user.phone_number ?? '—'}\n🆔 ${user.telegram_id}\n🌐 ${texts.languages[user.language]}`,
    )
    .join('\n\n');

  return `${texts.adminSearchResultsTitle(paginated.total)}\n${texts.adminSearchPageInfo(paginated.page, paginated.totalPages, paginated.total)}\n\n${entries}`;
}

export async function formatApplicationSearchResults(
  language: Language,
  results: ApplicationWithStudent[],
  paginated: PaginatedResult<ApplicationWithStudent>,
): Promise<string> {
  const texts = t(language);
  if (results.length === 0) return texts.adminSearchNoResults;

  const entries = (
    await Promise.all(results.map((app) => formatApplicationSummary(app, language)))
  ).join('\n\n');

  return `${texts.adminSearchResultsTitle(paginated.total)}\n${texts.adminSearchPageInfo(paginated.page, paginated.totalPages, paginated.total)}\n\n${entries}`;
}
