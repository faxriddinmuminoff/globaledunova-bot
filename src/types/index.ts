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
}

declare module 'telegraf' {
  interface Context {
    session: SessionData;
  }
}
