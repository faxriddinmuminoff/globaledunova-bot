export type Language = 'en' | 'ru' | 'uz';

export type CountryCode = 'de' | 'hu' | 'pl' | 'it' | 'tr';

export interface User {
  id: number;
  telegram_id: number;
  language: Language;
  phone_number: string | null;
  full_name: string | null;
  created_at: Date;
  updated_at: Date;
}

export enum OnboardingStep {
  Language = 'language',
  Phone = 'phone',
  Complete = 'complete',
}

export interface DocumentUploadFlow {
  applicationId: number;
  documentType: import('../documents/types').DocumentType;
}

export interface SessionData {
  onboardingStep: OnboardingStep;
  language: Language;
  user: User | null;
  documentFlow: DocumentUploadFlow | null;
  adminMode: boolean;
  adminSearchMode: import('../admin/types').AdminSearchMode | null;
  adminSearchQuery: string | null;
  adminSearchPage: number;
  adminWizard: import('../admin/types').AdminWizardState | null;
}

export interface Translations {
  welcome: string;
  languageSelected: string;
  sharePhone: string;
  phoneReceived: string;
  mainMenu: string;
  universities: string;
  myApplications: string;
  documents: string;
  myDocuments: string;
  notifications: string;
  contactManager: string;
  profile: string;
  sharePhoneButton: string;
  backToMenu: string;
  contactManagerText: (username?: string) => string;
  profileText: (name: string, phone: string, language: string) => string;
  invalidPhone: string;
  errorGeneric: string;
  changeLanguage: string;
  languages: Record<Language, string>;
  selectCountry: string;
  selectDegree: string;
  degreeBachelor: string;
  degreeMaster: string;
  degreePhd: string;
  countries: Record<CountryCode, string>;
  universityListHeader: (country: string, degree: string) => string;
  universityCard: (number: number, name: string, city: string) => string;
  applyButton: string;
  applicationSuccess: (university: string, country: string, degree: string) => string;
  applicationDuplicate: string;
  applicationsListTitle: string;
  noApplicationsYet: string;
  applicationEntry: (
    number: number,
    university: string,
    country: string,
    degree: string,
    date: string,
    status: string,
  ) => string;
  applicationStatuses: Record<
    import('../universities/types').ApplicationStatus,
    string
  >;
  backToCountries: string;
  backToDegrees: string;
  noApplicationsForDocuments: string;
  selectApplicationForDocument: string;
  selectDocumentType: string;
  documentTypes: Record<
    import('../documents/types').DocumentType,
    string
  >;
  uploadDocumentPrompt: (documentType: string, applicationLabel: string) => string;
  documentUploadSuccess: (documentType: string, fileName: string) => string;
  documentUploadDuplicate: string;
  invalidFileType: string;
  fileTooLarge: string;
  pleaseUploadFile: string;
  applicationNotFound: string;
  myDocumentsTitle: string;
  noDocumentsYet: string;
  myDocumentEntry: (
    number: number,
    documentType: string,
    uploadDate: string,
    status: string,
    fileName: string,
  ) => string;
  documentStatusPending: string;
  documentStatusVerified: string;
  documentStatusRejected: string;
  cancelUpload: string;
  uploadCancelled: string;
  notificationsWithCount: (count: number) => string;
  notificationsListTitle: string;
  notificationsListTitleWithUnread: (count: number) => string;
  noNotificationsYet: string;
  notificationEntry: (
    number: number,
    title: string,
    message: string,
    date: string,
    readStatus: string,
  ) => string;
  notificationRead: string;
  notificationUnread: string;
  markAllNotificationsRead: string;
  clearAllNotifications: string;
  notificationMarkedRead: string;
  allNotificationsMarkedRead: (count: number) => string;
  noUnreadNotifications: string;
  notificationsCleared: (count: number) => string;
  notificationNotFound: string;
  notificationStatusChangeTitle: string;
  notificationStatusChangeMessage: (
    university: string,
    previousStatus: string,
    newStatus: string,
  ) => string;
  notificationApplicationSubmittedTitle: string;
  notificationApplicationSubmittedMessage: (
    university: string,
    status: string,
  ) => string;
  adminUnauthorized: string;
  adminMenu: string;
  adminNewApplications: string;
  adminDocuments: string;
  adminStudents: string;
  adminStatistics: string;
  adminBack: string;
  adminBackToBot: string;
  adminNoApplications: string;
  adminNewApplicationsTitle: (count: number) => string;
  adminApplicationEntry: (
    studentName: string,
    phone: string,
    university: string,
    country: string,
    degree: string,
    status: string,
    createdDate: string,
    applicationId: number,
  ) => string;
  adminApplicationDetails: (
    applicationId: number,
    studentName: string,
    phone: string,
    telegramId: number,
    university: string,
    country: string,
    degree: string,
    status: string,
    createdDate: string,
    updatedDate: string,
  ) => string;
  adminViewButton: string;
  adminAcceptButton: string;
  adminRequestDocumentsButton: string;
  adminRejectButton: string;
  adminApplicationNotFound: string;
  adminStatusUpdated: (status: string) => string;
  adminDocumentsTitle: string;
  adminNoDocuments: string;
  adminDocumentEntry: (
    number: number,
    studentName: string,
    documentType: string,
    fileName: string,
    status: string,
    uploadDate: string,
    applicationId: number,
  ) => string;
  adminStudentsTitle: string;
  adminNoStudents: string;
  adminStudentEntry: (
    number: number,
    name: string,
    phone: string,
    language: string,
    registeredDate: string,
    telegramId: number,
  ) => string;
  adminStatisticsText: (
    totalUsers: number,
    totalApplications: number,
    totalDocuments: number,
    pendingReview: number,
    accepted: number,
    rejected: number,
    documentsRequired: number,
    pendingDocuments: number,
    topCountries: string,
    topUniversities: string,
  ) => string;
  adminSearch: string;
  adminSearchTitle: string;
  adminSearchByPhone: string;
  adminSearchByTelegramId: string;
  adminSearchByName: string;
  adminSearchPromptPhone: string;
  adminSearchPromptTelegramId: string;
  adminSearchPromptName: string;
  adminSearchNoResults: string;
  adminSearchInvalidTelegramId: string;
  adminSearchResultsTitle: (count: number) => string;
  adminChecklistIcon: (state: 'missing' | 'pending' | 'verified' | 'rejected') => string;
  adminDocumentChecklistTitle: string;
  adminUploadedDocsTitle: string;
  adminMissingDocsTitle: string;
  adminNoUploadedDocuments: string;
  adminAllDocumentsUploaded: string;
  adminDocOpenButton: string;
  adminDocVerifyButton: string;
  adminDocRejectButton: string;
  adminDocumentNotFound: string;
  adminDocumentVerified: string;
  adminDocumentRejected: string;
  adminDocumentOpened: string;
  managerNewApplicationAlert: (
    studentName: string,
    phone: string,
    university: string,
    country: string,
    degree: string,
    createdDate: string,
    applicationId: number,
  ) => string;
  managerNewDocumentAlert: (
    studentName: string,
    phone: string,
    university: string,
    country: string,
    degree: string,
    documentType: string,
    fileName: string,
    uploadDate: string,
    applicationId: number,
  ) => string;
  notificationDocumentVerifiedTitle: string;
  notificationDocumentVerifiedMessage: (documentType: string) => string;
  notificationDocumentRejectedTitle: string;
  notificationDocumentRejectedMessage: (documentType: string) => string;
  appDetailPage: (
    university: string,
    country: string,
    degree: string,
    status: string,
    timeline: string,
    checklist: string,
    uploaded: string,
    missing: string,
    appId: number,
  ) => string;
  appNoTimeline: string;
  appTimelineEntry: (date: string, fromStatus: string, toStatus: string) => string;
  appRefreshButton: string;
  appUploadMissingButton: string;
  appContactManagerButton: string;
  appRefreshed: string;
  appContactReference: (appId: number) => string;
  adminDashboard: string;
  adminIncidents: string;
  managerDashboardText: (
    today: number,
    month: number,
    pending: number,
    docsPending: number,
    rate: number,
    topCountries: string,
    topUniversities: string,
    activeStudents: string,
  ) => string;
  documentReminderTitle: string;
  documentReminderMessage: (days: number) => string;
  rateLimitExceeded: string;
  adminDocDownloadButton: string;
  adminSearchByApplicationId: string;
  adminSearchByUniversity: string;
  adminSearchByStatus: string;
  adminSearchPromptApplicationId: string;
  adminSearchPromptUniversity: string;
  adminSearchPromptStatus: string;
  adminSearchPageInfo: (page: number, totalPages: number, total: number) => string;
  adminSettings: string;
  adminUniversities: string;
  adminBroadcasts: string;
  adminBackups: string;
  adminSettingsTitle: string;
  adminSettingsManager: string;
  adminSettingsReminder: string;
  adminSettingsStorage: string;
  adminSettingsNotifications: string;
  adminSettingsMaintenance: string;
  adminSettingsUpdated: (key: string) => string;
  adminUniversitiesTitle: string;
  adminUniversityAdd: string;
  adminUniversityList: string;
  adminUniversityWizardCountry: string;
  adminUniversityWizardDegree: string;
  adminUniversityWizardNameEn: string;
  adminUniversityWizardConfirm: string;
  adminUniversitySaved: (id: string) => string;
  adminUniversityDeactivated: (id: string) => string;
  adminBroadcastsTitle: string;
  adminBroadcastCreate: string;
  adminBroadcastAudienceAll: string;
  adminBroadcastAudienceAccepted: string;
  adminBroadcastAudienceReviewing: string;
  adminBroadcastAudienceDocsRequired: string;
  adminBroadcastEnterMessage: string;
  adminBroadcastPreview: (message: string, targets: number) => string;
  adminBroadcastQueued: (id: number) => string;
  adminBroadcastCancelled: (id: number) => string;
  adminBackupsTitle: string;
  adminBackupsStatus: (last: string, size: string, retention: number) => string;
  adminBackupsRun: string;
  adminBackupsRestoreHint: string;
  adminSearchPrev: string;
  adminSearchNext: string;
  softLaunchBlocked: string;
  softLaunchMaxApplications: string;
  /**
   * Faza 0 — the institution application flow.
   *
   * Kept as one nested namespace rather than another ~50 flat keys: the flat keys
   * above belong to the study-abroad domain this bot is being repurposed away
   * from, and most of them are removed in a later step. When that happens
   * `orgApp` is what remains, already grouped.
   */
  orgApp: OrgAppTranslations;
}

export interface OrgAppTranslations {
  menuApply: string;
  menuMyApplications: string;

  intro: string;
  stepHint: (current: number, total: number) => string;

  askOrgType: string;
  orgTypeLabels: Record<
    'university' | 'institute' | 'college' | 'training-center' | 'corporate-academy' | 'other',
    string
  >;
  askOrgName: string;
  askStir: string;
  askLastName: string;
  askFirstName: string;
  askMiddleName: string;
  askPhone: string;
  askCharter: string;

  confirmTitle: string;
  summary: (fields: {
    organizationType: string;
    organizationName: string;
    stir: string;
    responsibleFullName: string;
    phone: string;
    charterFileName: string;
  }) => string;

  buttonBack: string;
  buttonCancel: string;
  buttonSkip: string;
  buttonSubmit: string;
  buttonSharePhone: string;

  cancelled: string;
  alreadyInProgress: string;

  errorRequired: string;
  errorTooLong: string;
  errorStirFormat: string;
  errorPhoneFormat: string;
  errorFileType: string;
  errorFileTooLarge: string;
  errorExpectDocument: string;
  errorPickFromButtons: string;

  submitting: string;
  submitted: (applicationId: string) => string;
  submitFailedStirTaken: string;
  submitFailedValidation: string;
  submitFailedUnavailable: string;

  statusLabels: Record<
    | 'submitted'
    | 'verify_passed'
    | 'verify_failed'
    | 'pa_approved'
    | 'pa_rejected'
    | 'owner_approved'
    | 'owner_rejected'
    | 'activated',
    string
  >;
  statusChanged: (organizationName: string, statusLabel: string) => string;
  statusReason: (reason: string) => string;
  activatedExtra: string;

  myApplicationsTitle: string;
  myApplicationsEmpty: string;
  myApplicationEntry: (fields: {
    index: number;
    organizationName: string;
    organizationType: string;
    stir: string;
    statusLabel: string;
    submittedDate: string;
  }) => string;
}

declare module 'telegraf' {
  interface Context {
    session: SessionData;
  }
}
