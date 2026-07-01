import { Language, User } from '../types';
import { Application, ApplicationStatus } from '../universities/types';
import { Document } from '../documents/types';

export const ADMIN_VIEW_PREFIX = 'adm:v:';
export const ADMIN_ACCEPT_PREFIX = 'adm:a:';
export const ADMIN_DOC_REQ_PREFIX = 'adm:d:';
export const ADMIN_REJECT_PREFIX = 'adm:r:';
export const ADMIN_DOC_OPEN_PREFIX = 'adm:do:';
export const ADMIN_DOC_VERIFY_PREFIX = 'adm:dv:';
export const ADMIN_DOC_REJECT_PREFIX = 'adm:dr:';
export const ADMIN_SEARCH_PHONE = 'adm:s:p';
export const ADMIN_SEARCH_TGID = 'adm:s:t';
export const ADMIN_SEARCH_NAME = 'adm:s:n';

export type AdminSearchMode =
  | 'phone'
  | 'telegram_id'
  | 'name'
  | 'application_id'
  | 'university'
  | 'status';

export const ADMIN_SEARCH_APP_ID = 'adm:s:ai';
export const ADMIN_SEARCH_UNI = 'adm:s:un';
export const ADMIN_SEARCH_STATUS = 'adm:s:st';
export const ADMIN_SEARCH_PREV = 'adm:s:prev';
export const ADMIN_SEARCH_NEXT = 'adm:s:next';

export const ADMIN_SET_MANAGER = 'adm:set:mgr';
export const ADMIN_SET_REMINDER = 'adm:set:rem';
export const ADMIN_SET_STORAGE = 'adm:set:sto';
export const ADMIN_SET_NOTIF = 'adm:set:not';
export const ADMIN_SET_MAINT = 'adm:set:mnt';

export const ADMIN_UNI_ADD = 'adm:uni:add';
export const ADMIN_UNI_LIST = 'adm:uni:list';
export const ADMIN_UNI_DEACTIVATE_PREFIX = 'adm:uni:off:';

export const ADMIN_BC_CREATE = 'adm:bc:new';
export const ADMIN_BC_AUDIENCE_PREFIX = 'adm:bc:aud:';
export const ADMIN_BC_CONFIRM = 'adm:bc:ok';
export const ADMIN_BC_CANCEL_PREFIX = 'adm:bc:cancel:';

export const ADMIN_BACKUP_RUN = 'adm:bk:run';
export const ADMIN_BACKUP_LIST = 'adm:bk:list';
export const ADMIN_BACKUP_VERIFY = 'adm:bk:verify';
export const ADMIN_BACKUP_RESTORE_SIM = 'adm:bk:restore';

export const ADMIN_INCIDENTS = 'adm:inc:list';
export const ADMIN_INCIDENT_RETRY_PREFIX = 'adm:inc:retry:';
export const ADMIN_INCIDENT_IGNORE_PREFIX = 'adm:inc:ignore:';
export const ADMIN_INCIDENT_DETAILS_PREFIX = 'adm:inc:details:';

export const ADMIN_DASH_TODAY = 'adm:dash:today';
export const ADMIN_DASH_WEEK = 'adm:dash:week';
export const ADMIN_DASH_MONTH = 'adm:dash:month';

export interface AdminWizardState {
  type: 'settings' | 'university' | 'broadcast';
  step: string;
  data: Record<string, unknown>;
}

export type AdminUpdatableStatus = Extract<
  ApplicationStatus,
  | 'submitted'
  | 'reviewing'
  | 'documents_required'
  | 'documents_completed'
  | 'accepted'
  | 'rejected'
  | 'visa_processing'
  | 'visa_approved'
  | 'enrolled'
>;

export const ADMIN_UPDATABLE_STATUSES: AdminUpdatableStatus[] = [
  'submitted',
  'reviewing',
  'documents_required',
  'documents_completed',
  'accepted',
  'rejected',
  'visa_processing',
  'visa_approved',
  'enrolled',
];

export interface ApplicationWithStudent extends Application {
  student_name: string | null;
  student_phone: string | null;
  student_language: Language;
}

export interface DocumentWithStudent extends Document {
  student_name: string | null;
}

export interface AdminStatistics {
  totalUsers: number;
  totalApplications: number;
  totalDocuments: number;
  pendingReviewApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  documentsRequiredApplications: number;
  pendingDocuments: number;
  applicationsByStatus: Partial<Record<ApplicationStatus, number>>;
  topCountries: { country: string; count: number }[];
  topUniversities: { universityId: string; count: number }[];
}

export interface StudentSummary extends User {}
