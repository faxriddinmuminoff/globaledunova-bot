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
    documents_completed: '✅ Documents Completed',
    sent_to_university: '🏫 Sent to University',
    accepted: '✅ Accepted',
    rejected: '❌ Rejected',
    visa_processing: '🛂 Visa Processing',
    visa_approved: '✅ Visa Approved',
    enrolled: '🎓 Enrolled',
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
  adminUnauthorized: '⛔ You are not authorized to access the admin panel.',
  adminMenu: '🔐 *Admin Panel*\n\nSelect an option:',
  adminNewApplications: '📥 New Applications',
  adminDocuments: '📄 Documents',
  adminStudents: '👥 Students',
  adminStatistics: '📊 Statistics',
  adminBack: '⬅ Back',
  adminBackToBot: 'Returned to student mode. Send /start to open the main menu.',
  adminNoApplications: '📥 *New Applications*\n\nNo applications found.',
  adminNewApplicationsTitle: (count) => `📥 *New Applications* (${count})`,
  adminApplicationEntry: (studentName, phone, university, country, degree, status, createdDate, applicationId) =>
    `*Application #${applicationId}*\n👤 ${studentName}\n📱 ${phone}\n🏫 ${university}\n🌍 ${country} · 📚 ${degree}\n📊 ${status}\n📅 ${createdDate}`,
  adminApplicationDetails: (applicationId, studentName, phone, telegramId, university, country, degree, status, createdDate, updatedDate) =>
    `👁 *Application #${applicationId}*\n\n👤 Student: ${studentName}\n📱 Phone: ${phone}\n🆔 Telegram ID: ${telegramId}\n🏫 University: ${university}\n🌍 Country: ${country}\n📚 Degree: ${degree}\n📊 Status: ${status}\n📅 Created: ${createdDate}\n🔄 Updated: ${updatedDate}`,
  adminViewButton: '👁 View',
  adminAcceptButton: '✅ Accept',
  adminRequestDocumentsButton: '📄 Request Documents',
  adminRejectButton: '❌ Reject',
  adminApplicationNotFound: 'Application not found.',
  adminStatusUpdated: (status) => `Status updated to ${status}`,
  adminDocumentsTitle: '📄 *Recent Documents*',
  adminNoDocuments: '📄 *Documents*\n\nNo documents uploaded yet.',
  adminDocumentEntry: (number, studentName, documentType, fileName, status, uploadDate, applicationId) =>
    `*${number}.* ${documentType}\n👤 ${studentName}\n📎 ${fileName}\n📋 App #${applicationId}\n🔍 ${status}\n📅 ${uploadDate}`,
  adminStudentsTitle: '👥 *Recent Students*',
  adminNoStudents: '👥 *Students*\n\nNo registered students yet.',
  adminStudentEntry: (number, name, phone, language, registeredDate, telegramId) =>
    `*${number}.* ${name}\n📱 ${phone}\n🌐 ${language}\n🆔 ${telegramId}\n📅 ${registeredDate}`,
  adminStatisticsText: (
    totalUsers,
    totalApplications,
    totalDocuments,
    pendingReview,
    accepted,
    rejected,
    documentsRequired,
    pendingDocuments,
    topCountries,
    topUniversities,
  ) =>
    `📊 *Statistics*\n\n👥 Students: ${totalUsers}\n📋 Applications: ${totalApplications}\n📄 Documents: ${totalDocuments}\n\n*Application pipeline:*\n🔍 Pending review: ${pendingReview}\n✅ Accepted: ${accepted}\n❌ Rejected: ${rejected}\n📄 Documents required: ${documentsRequired}\n⏳ Documents pending verification: ${pendingDocuments}\n\n*Top countries:*\n${topCountries}\n\n*Top universities:*\n${topUniversities}`,
  adminSearch: '🔎 Search Students',
  adminSearchTitle: '🔎 *Search Students*\n\nSelect search type:',
  adminSearchByPhone: '📱 By phone',
  adminSearchByTelegramId: '🆔 By Telegram ID',
  adminSearchByName: '👤 By name',
  adminSearchPromptPhone: '📱 *Search by phone*\n\nEnter phone number (full or partial):',
  adminSearchPromptTelegramId: '🆔 *Search by Telegram ID*\n\nEnter numeric Telegram user ID:',
  adminSearchPromptName: '👤 *Search by name*\n\nEnter student name (partial match):',
  adminSearchNoResults: 'No students found matching your query.',
  adminSearchInvalidTelegramId: 'Invalid Telegram ID. Please enter a numeric ID.',
  adminSearchResultsTitle: (count) => `🔎 *Search results* (${count})`,
  adminChecklistIcon: (state) => {
    const icons = { missing: '❌', pending: '🔍', verified: '✅', rejected: '⚠' };
    return icons[state];
  },
  adminDocumentChecklistTitle: '📋 *Required documents checklist:*',
  adminUploadedDocsTitle: '📎 *Uploaded documents:*',
  adminMissingDocsTitle: '📭 *Missing documents:*',
  adminNoUploadedDocuments: '— None yet',
  adminAllDocumentsUploaded: '— All required documents uploaded',
  adminDocOpenButton: '👁 Open',
  adminDocVerifyButton: '✅ Verify',
  adminDocRejectButton: '❌ Reject',
  adminDocumentNotFound: 'Document not found.',
  adminDocumentVerified: 'Document verified',
  adminDocumentRejected: 'Document rejected',
  adminDocumentOpened: 'Document sent',
  managerNewApplicationAlert: (studentName, phone, university, country, degree, createdDate, applicationId) =>
    `🆕 *New Application #${applicationId}*\n\n👤 ${studentName}\n📱 ${phone}\n🏫 ${university}\n🌍 ${country}\n📚 ${degree}\n📅 ${createdDate}`,
  managerNewDocumentAlert: (studentName, phone, university, country, degree, documentType, fileName, uploadDate, applicationId) =>
    `📄 *New Document — Application #${applicationId}*\n\n👤 ${studentName}\n📱 ${phone}\n🏫 ${university}\n🌍 ${country} · 📚 ${degree}\n📎 ${documentType}: ${fileName}\n📅 ${uploadDate}`,
  notificationDocumentVerifiedTitle: 'Document Verified',
  notificationDocumentVerifiedMessage: (documentType) => `${documentType} verified`,
  notificationDocumentRejectedTitle: 'Document Rejected',
  notificationDocumentRejectedMessage: (documentType) => `${documentType} rejected`,
  appDetailPage: (university, country, degree, status, timeline, checklist, uploaded, missing, appId) =>
    `📋 *My Application #${appId}*\n\n🏫 ${university}\n🌍 ${country}\n📚 ${degree}\n📊 ${status}\n\n📅 *Timeline:*\n${timeline}\n\n📋 *Required documents:*\n${checklist}\n\n📎 *Uploaded:*\n${uploaded}\n\n📭 *Missing:*\n${missing}`,
  appNoTimeline: '— No events yet',
  appTimelineEntry: (date, fromStatus, toStatus) => `• ${date}: ${fromStatus} → ${toStatus}`,
  appRefreshButton: '🔄 Refresh',
  appUploadMissingButton: '📄 Upload Missing Documents',
  appContactManagerButton: '💬 Contact Manager',
  appRefreshed: 'Application refreshed',
  appContactReference: (appId) => `Reference: Application #${appId}`,
  adminDashboard: '📊 Manager Dashboard',
  managerDashboardText: (today, month, pending, docsPending, rate, topCountries, topUniversities, activeStudents) =>
    `📊 *Manager Dashboard*\n\n📅 Today: ${today}\n📆 This month: ${month}\n🔍 Pending reviews: ${pending}\n⏳ Documents pending: ${docsPending}\n✅ Acceptance rate: ${rate}%\n\n*Top countries:*\n${topCountries}\n\n*Top universities:*\n${topUniversities}\n\n*Most active students:*\n${activeStudents}`,
  documentReminderTitle: 'Document Reminder',
  documentReminderMessage: (days) => `You have missing documents. Please upload them (${days}-day reminder).`,
  rateLimitExceeded: '⏳ Too many requests. Please wait a moment and try again.',
  adminDocDownloadButton: '⬇ Download',
  adminSearchByApplicationId: '📋 By application ID',
  adminSearchByUniversity: '🏫 By university',
  adminSearchByStatus: '📊 By status',
  adminSearchPromptApplicationId: '📋 Enter application ID:',
  adminSearchPromptUniversity: '🏫 Enter university ID (e.g. de-1):',
  adminSearchPromptStatus: '📊 Enter status (e.g. reviewing):',
  adminSearchPageInfo: (page, totalPages, total) => `Page ${page}/${totalPages} (${total} results)`,
  adminSettings: '⚙ Settings',
  adminUniversities: '🏫 Universities',
  adminBroadcasts: '📢 Broadcasts',
  adminBackups: '💾 Backups',
  adminIncidents: '🚨 Incidents',
  adminSettingsTitle: '⚙ *Settings*',
  adminSettingsManager: '👤 Manager Username',
  adminSettingsReminder: '⏰ Reminder Intervals',
  adminSettingsStorage: '📦 Storage Provider',
  adminSettingsNotifications: '🔔 Notifications Toggle',
  adminSettingsMaintenance: '🛠 Maintenance Mode',
  adminSettingsUpdated: (key) => `Setting updated: ${key}`,
  adminUniversitiesTitle: '🏫 *Universities*',
  adminUniversityAdd: '➕ Add University',
  adminUniversityList: '📋 List / Deactivate',
  adminUniversityWizardCountry: 'Select country:',
  adminUniversityWizardDegree: 'Select supported degrees:',
  adminUniversityWizardNameEn: 'Enter university name (EN):',
  adminUniversityWizardConfirm: 'Toggle requirements, then save:',
  adminUniversitySaved: (id) => `University saved: ${id}`,
  adminUniversityDeactivated: (id) => `University deactivated: ${id}`,
  adminBroadcastsTitle: '📢 *Broadcasts*',
  adminBroadcastCreate: '➕ New Broadcast',
  adminBroadcastAudienceAll: '👥 All students',
  adminBroadcastAudienceAccepted: '✅ Accepted',
  adminBroadcastAudienceReviewing: '🔍 Reviewing',
  adminBroadcastAudienceDocsRequired: '📄 Documents Required',
  adminBroadcastEnterMessage: 'Enter broadcast message:',
  adminBroadcastPreview: (message, targets) => `*Preview*\n\n${message}\n\nTargets: ${targets}`,
  adminBroadcastQueued: (id) => `Broadcast #${id} queued for delivery`,
  adminBroadcastCancelled: (id) => `Broadcast #${id} cancelled`,
  adminBackupsTitle: '💾 *Backups*',
  adminBackupsStatus: (last, size, retention) =>
    `Last backup: ${last}\nDatabase size: ${size}\nRetention: ${retention} days`,
  adminBackupsRun: '▶ Run Backup Now',
  adminBackupsRestoreHint: 'Restore: `./scripts/restore-db.sh backups/<file>.sql`',
  adminSearchPrev: '⬅ Previous',
  adminSearchNext: 'Next ➡',
  softLaunchBlocked: '⏳ Bot is in soft launch mode. Access is limited.',
  softLaunchMaxApplications: 'You reached the application limit during soft launch.',

  orgApp: {
    menuApply: '🏛 Apply to the platform',
    menuMyApplications: '📋 My applications',

    intro:
      '🏛 *Application to join the platform*\n\nYou are applying to connect your institution to the platform. I will ask 8 questions and then request a copy of your charter.\n\nYou can go back at any step with ⬅️.',
    stepHint: (current, total) => `Step ${current} / ${total}`,

    askOrgType: '🏫 Choose the type of institution:',
    orgTypeLabels: {
      university: '🎓 University',
      institute: '🏛 Institute',
      college: '🏫 College',
      'training-center': '📚 Training centre',
      'corporate-academy': '🏢 Corporate academy',
      other: '📄 Other',
    },
    askOrgName: '✍️ Write the *full official name* of the institution (as in the charter):',
    askStir:
      '🔢 Write the *STIR* (taxpayer identification number).\n\nDigits only, 9–14 of them. I will strip spaces and dashes myself.',
    askLastName: '👤 Write the *surname* of the responsible person:',
    askFirstName: '👤 Write the *given name* of the responsible person:',
    askMiddleName:
      '👤 Write the *patronymic* of the responsible person.\n\nIf there is none, press "Skip".',
    askPhone:
      '📞 Write the *phone number* of the responsible person, or share it with the button.\n\nFor example: `901234567` or `+998901234567`',
    askCharter:
      '📎 Send a *copy of the charter* (as a file).\n\nAllowed types: PDF, JPG, PNG. Maximum size: 20 MB.\n\n⚠️ Send an image as a *file*, not as a "photo", so the quality is preserved.',

    confirmTitle: '✅ *Review your application*',
    summary: (f) =>
      `🏫 Type: *${f.organizationType}*\n` +
      `🏛 Name: *${f.organizationName}*\n` +
      `🔢 STIR: \`${f.stir}\`\n` +
      `👤 Responsible: *${f.responsibleFullName}*\n` +
      `📞 Phone: \`${f.phone}\`\n` +
      `📎 Charter: ${f.charterFileName}`,

    buttonBack: '⬅️ Back',
    buttonCancel: '❌ Cancel',
    buttonSkip: '⏭ Skip',
    buttonSubmit: '📨 Submit application',
    buttonSharePhone: '📞 Share number',

    cancelled: '❌ Application cancelled. Use the menu to start again.',
    alreadyInProgress:
      'You have an unfinished application. Continue it, or press ❌ Cancel.',

    errorRequired: '❌ This field cannot be empty. Please write it again.',
    errorTooLong: '❌ Too long. Please write it shorter.',
    errorStirFormat: '❌ STIR must be digits only, 9–14 of them.',
    errorPhoneFormat: '❌ That phone number is not clear. For example: `901234567`',
    errorFileType: '❌ Send a PDF, JPG or PNG file only.',
    errorFileTooLarge: '❌ The file is larger than 20 MB. Send a smaller copy.',
    errorExpectDocument: '📎 A file is expected now — please send the charter copy.',
    errorPickFromButtons: 'Please choose one of the options above.',

    submitting: '⏳ Submitting the application...',
    submitted: (applicationId) =>
      `✅ *Application received!*\n\nApplication id: \`${applicationId}\`\n\nA platform administrator will now review it. I will tell you here about every change.`,
    submitFailedStirTaken:
      '⚠️ An application with this STIR already exists.\n\nIf this is your institution, please contact the platform administrator.',
    submitFailedValidation:
      '❌ The application was not accepted: there is an error in the data. Please try again.',
    submitFailedUnavailable:
      '⚠️ The platform is not responding right now. Nothing was saved — please try again shortly.',

    statusLabels: {
      submitted: '📤 Submitted',
      verify_failed: '❌ Failed verification',
      in_review: '🔍 Under review',
      pa_rejected: '❌ Rejected by the platform admin',
      awaiting_owner: '⏳ Awaiting approval',
      owner_approved: '✅ Approved',
      rejected: '❌ Rejected',
      needs_correction: '✏️ Correction required',
      activated: '🎉 Activated',
      archived: '📦 Archived',
    },
    statusChanged: (organizationName, statusLabel) =>
      `📬 *Application status changed*\n\n🏛 ${organizationName}\n📊 ${statusLabel}`,
    statusReason: (reason) => `\n\n💬 Comment: ${reason}`,
    activatedExtra:
      '\n\nYour institution has been activated on the platform. The rector account and sign-in details are delivered separately, *not through this bot*.',
    actionNeededExtra:
      '\n\n⚠️ This stage *needs action from you*. Read the comment, fix what was raised, and contact the platform administrator.',
    rejectedExtra:
      '\n\n⚠️ This is a final decision. The STIR you used stays reserved, so a new application will not be accepted automatically — please contact the platform administrator.',

    myApplicationsTitle: '📋 *My applications*',
    myApplicationsEmpty:
      '📋 *My applications*\n\nYou have no applications yet.\n\nTo apply, go to 🏛 Apply to the platform.',
    myApplicationEntry: (f) =>
      `*${f.index}.* ${f.organizationName}\n🏫 ${f.organizationType} · 🔢 \`${f.stir}\`\n📅 ${f.submittedDate}\n📊 ${f.statusLabel}`,
  },
};
