import { Translations } from '../../types';

export const en: Translations = {
  welcome: '👋 Welcome to GlobalEduNova!\n\nWe help students apply to universities worldwide. Please select your language:',
  languageSelected: '✅ Language set to English.',
  sharePhone: '📱 Please share your phone number so we can contact you about your applications.',
  phoneReceived: '✅ Phone number saved successfully!',
  mainMenu: '🏠 Main Menu\n\nSelect an option:',
  universities: '🎓 Universities',
  myApplications: '📋 My Applications',
  documents: '📄 Documents',
  myDocuments: '📄 My Documents',
  notifications: '📬 Notifications',
  contactManager: '💬 Contact Manager',
  profile: '⚙️ Profile',
  sharePhoneButton: '📱 Share Phone Number',
  backToMenu: '◀️ Back to Menu',
  contactManagerText: (username?: string) =>
    username
      ? `💬 *Contact Manager*\n\nNeed help? Reach out to our manager:\n@${username}`
      : '💬 *Contact Manager*\n\nNeed help? Our manager will contact you shortly.',
  profileText: (name: string, phone: string, language: string) =>
    `⚙️ *Your Profile*\n\n👤 Name: ${name}\n📱 Phone: ${phone}\n🌐 Language: ${language}`,
  invalidPhone: '❌ Please use the button below to share your phone number.',
  errorGeneric: '❌ Something went wrong. Please try again later.',
  changeLanguage: '🌐 Change Language',
  languages: {
    en: '🇬🇧 English',
    ru: '🇷🇺 Русский',
    uz: '🇺🇿 O\'zbekcha',
  },
  selectCountry: '🌍 *Select Country*\n\nChoose the country where you want to study:',
  selectDegree: '📚 *Select Degree*\n\nChoose your degree level:',
  degreeBachelor: "🎓 Bachelor's",
  degreeMaster: "🎓 Master's",
  degreePhd: '🎓 PhD',
  countries: {
    de: '🇩🇪 Germany',
    hu: '🇭🇺 Hungary',
    pl: '🇵🇱 Poland',
    it: '🇮🇹 Italy',
    tr: '🇹🇷 Turkey',
  },
  universityListHeader: (country, degree) =>
    `🏫 *Universities in ${country}*\n📚 Program: *${degree}*\n\nSelect a university to apply:`,
  universityCard: (number, name, city) =>
    `*${number}. ${name}*\n📍 ${city}`,
  applyButton: '📝 Apply',
  applicationSuccess: (university, country, degree) =>
    `✅ Application submitted!\n\n🏫 ${university}\n🌍 ${country}\n📚 ${degree}\n\nOur team will contact you soon.`,
  applicationDuplicate: 'You have already applied to this university for this program.',
  applicationsListTitle: '📋 *My Applications*',
  noApplicationsYet:
    '📋 *My Applications*\n\nYou have no active applications yet.\n\nGo to 🎓 Universities to apply.',
  applicationEntry: (number, university, country, degree, date, status) =>
    `*${number}.* ${university}\n🌍 ${country} · 📚 ${degree}\n📅 ${date}\n📊 ${status}`,
  applicationStatuses: {
    draft: '📝 Draft',
    submitted: '📤 Submitted',
    reviewing: '🔍 Reviewing',
    documents_required: '📄 Documents Required',
    sent_to_university: '🏫 Sent to University',
    accepted: '✅ Accepted',
    rejected: '❌ Rejected',
    visa_processing: '🛂 Visa Processing',
    completed: '🎉 Completed',
  },
  backToCountries: '◀️ Back to Countries',
  backToDegrees: '◀️ Back to Degrees',
  noApplicationsForDocuments:
    '📄 *Documents*\n\nYou don\'t have any applications yet.\n\nSubmit an application via 🎓 Universities first.',
  selectApplicationForDocument:
    '📄 *Upload Document*\n\nSelect the application you want to upload a document for:',
  selectDocumentType: '📄 *Document Type*\n\nChoose the type of document to upload:',
  documentTypes: {
    passport: '🛂 Passport',
    diploma: '🎓 Diploma',
    transcript: '📜 Transcript',
    ielts: '📝 IELTS Certificate',
    motivation_letter: '✉️ Motivation Letter',
    photo: '📷 Photo',
  },
  uploadDocumentPrompt: (documentType, applicationLabel) =>
    `📤 *Upload ${documentType}*\n\nApplication: *${applicationLabel}*\n\nSend a PDF file or image (JPG, PNG, WEBP).\n\nMaximum file size: 20 MB.`,
  documentUploadSuccess: (documentType, fileName) =>
    `✅ *Document uploaded successfully!*\n\n📄 Type: ${documentType}\n📎 File: ${fileName}\n⏳ Status: Pending verification`,
  documentUploadDuplicate:
    'You have already uploaded this document type for the selected application.',
  invalidFileType:
    '❌ Invalid file type. Please send a PDF or an image (JPG, PNG, WEBP).',
  fileTooLarge: '❌ File is too large. Maximum allowed size is 20 MB.',
  pleaseUploadFile: '📤 Please send a PDF file or image to upload.',
  applicationNotFound: '❌ Application not found. Please start again from 📄 Documents.',
  myDocumentsTitle: '📄 *My Documents*',
  noDocumentsYet:
    '📄 *My Documents*\n\nNo documents uploaded yet.\n\nGo to 📄 Documents to upload files for your applications.',
  myDocumentEntry: (number, documentType, uploadDate, status, fileName) =>
    `*${number}.* ${documentType}\n📎 ${fileName}\n📅 ${uploadDate}\n🔍 ${status}`,
  documentStatusPending: '⏳ Pending verification',
  documentStatusVerified: '✅ Verified',
  documentStatusRejected: '❌ Rejected',
  cancelUpload: '✖️ Cancel',
  uploadCancelled: 'Upload cancelled.',
  notificationsWithCount: (count) => `📬 Notifications (${count})`,
  notificationsListTitle: '📬 *Notifications*',
  notificationsListTitleWithUnread: (count) => `📬 *Notifications* (${count} unread)`,
  noNotificationsYet: '📬 *Notifications*\n\nYou have no notifications yet.',
  notificationEntry: (number, title, message, date, readStatus) =>
    `${readStatus} *${number}.* ${title}\n${message}\n📅 ${date}`,
  notificationRead: '✅',
  notificationUnread: '🔵',
  markAllNotificationsRead: '✅ Mark all as read',
  clearAllNotifications: '🗑 Clear all notifications',
  notificationMarkedRead: 'Notification marked as read',
  allNotificationsMarkedRead: (count) => `${count} notification(s) marked as read`,
  noUnreadNotifications: 'No unread notifications',
  notificationsCleared: (count) => `${count} notification(s) cleared`,
  notificationNotFound: 'Notification not found',
  notificationStatusChangeTitle: 'Application Status Updated',
  notificationStatusChangeMessage: (university, previousStatus, newStatus) =>
    `Your application to *${university}* has been updated.\n\nPrevious: ${previousStatus}\nNew: *${newStatus}*`,
  notificationApplicationSubmittedTitle: 'Application Submitted',
  notificationApplicationSubmittedMessage: (university, status) =>
    `Your application to *${university}* has been submitted successfully.\n\nCurrent status: *${status}*`,
};
