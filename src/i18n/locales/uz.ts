import { Translations } from '../../types';

export const uz: Translations = {
  welcome: '👋 GlobalEduNova\'ga xush kelibsiz!\n\nBiz talabalarga dunyo universitetlariga ariza topshirishda yordam beramiz. Tilni tanlang:',
  languageSelected: '✅ Til O\'zbekcha ga o\'rnatildi.',
  sharePhone: '📱 Iltimos, arizalar bo\'yicha siz bilan bog\'lanishimiz uchun telefon raqamingizni ulashing.',
  phoneReceived: '✅ Telefon raqami muvaffaqiyatli saqlandi!',
  mainMenu: '🏠 Asosiy menyu\n\nVariantni tanlang:',
  universities: '🎓 Universitetlar',
  myApplications: '📋 Mening arizalarim',
  documents: '📄 Hujjatlar',
  myDocuments: '📄 Mening hujjatlarim',
  notifications: '📬 Bildirishnomalar',
  contactManager: '💬 Menejer bilan bog\'lanish',
  profile: '⚙️ Profil',
  sharePhoneButton: '📱 Telefon raqamini ulashish',
  backToMenu: '◀️ Menyuga qaytish',
  contactManagerText: (username?: string) =>
    username
      ? `💬 *Menejer bilan bog\'lanish*\n\nYordam kerakmi? Menejerimizga yozing:\n@${username}`
      : '💬 *Menejer bilan bog\'lanish*\n\nYordam kerakmi? Menejerimiz tez orada siz bilan bog\'lanadi.',
  profileText: (name: string, phone: string, language: string) =>
    `⚙️ *Sizning profilingiz*\n\n👤 Ism: ${name}\n📱 Telefon: ${phone}\n🌐 Til: ${language}`,
  invalidPhone: '❌ Iltimos, telefon raqamini ulashish uchun quyidagi tugmadan foydalaning.',
  errorGeneric: '❌ Nimadir xato ketdi. Keyinroq qayta urinib ko\'ring.',
  changeLanguage: '🌐 Tilni o\'zgartirish',
  languages: {
    en: '🇬🇧 English',
    ru: '🇷🇺 Русский',
    uz: '🇺🇿 O\'zbekcha',
  },
  selectCountry: '🌍 *Mamlakatni tanlang*\n\nO\'qimoqchi bo\'lgan mamlakatingizni tanlang:',
  selectDegree: '📚 *Darajani tanlang*\n\nTa\'lim darajasini tanlang:',
  degreeBachelor: '🎓 Bakalavr',
  degreeMaster: '🎓 Magistr',
  degreePhd: '🎓 PhD (Doktorantura)',
  countries: {
    de: '🇩🇪 Germaniya',
    hu: '🇭🇺 Vengriya',
    pl: '🇵🇱 Polsha',
    it: '🇮🇹 Italiya',
    tr: '🇹🇷 Turkiya',
  },
  universityListHeader: (country, degree) =>
    `🏫 *${country} universitetlari*\n📚 Dastur: *${degree}*\n\nAriza topshirish uchun universitetni tanlang:`,
  universityCard: (number, name, city) =>
    `*${number}. ${name}*\n📍 ${city}`,
  applyButton: '📝 Ariza topshirish',
  applicationSuccess: (university, country, degree) =>
    `✅ Ariza yuborildi!\n\n🏫 ${university}\n🌍 ${country}\n📚 ${degree}\n\nJamoamiz tez orada siz bilan bog\'lanadi.`,
  applicationDuplicate: 'Siz ushbu universitetga ushbu dastur bo\'yicha allaqachon ariza topshirgansiz.',
  applicationsListTitle: '📋 *Mening arizalarim*',
  noApplicationsYet:
    '📋 *Mening arizalarim*\n\nHozircha faol arizalaringiz yo\'q.\n\nAriza topshirish uchun 🎓 Universitetlar bo\'limiga o\'ting.',
  applicationEntry: (number, university, country, degree, date, status) =>
    `*${number}.* ${university}\n🌍 ${country} · 📚 ${degree}\n📅 ${date}\n📊 ${status}`,
  applicationStatuses: {
    draft: '📝 Qoralama',
    submitted: '📤 Yuborilgan',
    reviewing: '🔍 Ko\'rib chiqilmoqda',
    documents_required: '📄 Hujjatlar talab qilinadi',
    documents_completed: '✅ Hujjatlar to\'liq',
    sent_to_university: '🏫 Universitetga yuborilgan',
    accepted: '✅ Qabul qilingan',
    rejected: '❌ Rad etilgan',
    visa_processing: '🛂 Viza rasmiylashtirilmoqda',
    visa_approved: '✅ Viza tasdiqlandi',
    enrolled: '🎓 O\'qishga qabul qilindi',
    completed: '🎉 Yakunlangan',
  },
  backToCountries: '◀️ Mamlakatlar ro\'yxatiga',
  backToDegrees: '◀️ Darajalar ro\'yxatiga',
  noApplicationsForDocuments:
    '📄 *Hujjatlar*\n\nSizda hali arizalar yo\'q.\n\nAvval 🎓 Universitetlar orqali ariza topshiring.',
  selectApplicationForDocument:
    '📄 *Hujjat yuklash*\n\nHujjat yuklamoqchi bo\'lgan arizangizni tanlang:',
  selectDocumentType: '📄 *Hujjat turi*\n\nYuklamoqchi bo\'lgan hujjat turini tanlang:',
  documentTypes: {
    passport: '🛂 Pasport',
    diploma: '🎓 Diplom',
    transcript: '📜 Transkript (baholar)',
    ielts: '📝 IELTS sertifikati',
    motivation_letter: '✉️ Motivatsion xat',
    photo: '📷 Fotosurat',
  },
  uploadDocumentPrompt: (documentType, applicationLabel) =>
    `📤 *Yuklash: ${documentType}*\n\nAriza: *${applicationLabel}*\n\nPDF fayl yoki rasm yuboring (JPG, PNG, WEBP).\n\nMaksimal hajm: 20 MB.`,
  documentUploadSuccess: (documentType, fileName) =>
    `✅ *Hujjat muvaffaqiyatli yuklandi!*\n\n📄 Turi: ${documentType}\n📎 Fayl: ${fileName}\n⏳ Holat: Tekshiruv kutilmoqda`,
  documentUploadDuplicate:
    'Siz ushbu ariza uchun ushbu turdagi hujjatni allaqachon yuklagansiz.',
  invalidFileType:
    '❌ Noto\'g\'ri fayl turi. PDF yoki rasm yuboring (JPG, PNG, WEBP).',
  fileTooLarge: '❌ Fayl juda katta. Maksimal hajm — 20 MB.',
  pleaseUploadFile: '📤 Iltimos, PDF fayl yoki rasm yuboring.',
  applicationNotFound: '❌ Ariza topilmadi. 📄 Hujjatlar bo\'limidan qayta boshlang.',
  myDocumentsTitle: '📄 *Mening hujjatlarim*',
  noDocumentsYet:
    '📄 *Mening hujjatlarim*\n\nHozircha hujjatlar yuklanmagan.\n\nFayl yuklash uchun 📄 Hujjatlar bo\'limiga o\'ting.',
  myDocumentEntry: (number, documentType, uploadDate, status, fileName) =>
    `*${number}.* ${documentType}\n📎 ${fileName}\n📅 ${uploadDate}\n🔍 ${status}`,
  documentStatusPending: '⏳ Tekshiruv kutilmoqda',
  documentStatusVerified: '✅ Tasdiqlangan',
  documentStatusRejected: '❌ Rad etilgan',
  cancelUpload: '✖️ Bekor qilish',
  uploadCancelled: 'Yuklash bekor qilindi.',
  notificationsWithCount: (count) => `📬 Bildirishnomalar (${count})`,
  notificationsListTitle: '📬 *Bildirishnomalar*',
  notificationsListTitleWithUnread: (count) => `📬 *Bildirishnomalar* (${count} o\'qilmagan)`,
  noNotificationsYet: '📬 *Bildirishnomalar*\n\nHozircha bildirishnomalar yo\'q.',
  notificationEntry: (number, title, message, date, readStatus) =>
    `${readStatus} *${number}.* ${title}\n${message}\n📅 ${date}`,
  notificationRead: '✅',
  notificationUnread: '🔵',
  markAllNotificationsRead: '✅ Hammasini o\'qilgan deb belgilash',
  clearAllNotifications: '🗑 Barcha bildirishnomalarni tozalash',
  notificationMarkedRead: 'Bildirishnoma o\'qilgan deb belgilandi',
  allNotificationsMarkedRead: (count) => `${count} ta bildirishnoma o\'qilgan deb belgilandi`,
  noUnreadNotifications: 'O\'qilmagan bildirishnomalar yo\'q',
  notificationsCleared: (count) => `${count} ta bildirishnoma o\'chirildi`,
  notificationNotFound: 'Bildirishnoma topilmadi',
  notificationStatusChangeTitle: 'Ariza holati yangilandi',
  notificationStatusChangeMessage: (university, previousStatus, newStatus) =>
    `*${university}* ga arizangiz holati o\'zgartirildi.\n\nOldingi: ${previousStatus}\nYangi: *${newStatus}*`,
  notificationApplicationSubmittedTitle: 'Ariza yuborildi',
  notificationApplicationSubmittedMessage: (university, status) =>
    `*${university}* ga arizangiz muvaffaqiyatli yuborildi.\n\nJoriy holat: *${status}*`,
  adminUnauthorized: '⛔ Admin paneliga kirish huquqingiz yo\'q.',
  adminMenu: '🔐 *Admin panel*\n\nVariantni tanlang:',
  adminNewApplications: '📥 Yangi arizalar',
  adminDocuments: '📄 Hujjatlar',
  adminStudents: '👥 Talabalar',
  adminStatistics: '📊 Statistika',
  adminBack: '⬅ Orqaga',
  adminBackToBot: 'Talaba rejimiga qaytdingiz. Asosiy menyu uchun /start yuboring.',
  adminNoApplications: '📥 *Yangi arizalar*\n\nArizalar topilmadi.',
  adminNewApplicationsTitle: (count) => `📥 *Yangi arizalar* (${count})`,
  adminApplicationEntry: (studentName, phone, university, country, degree, status, createdDate, applicationId) =>
    `*Ariza #${applicationId}*\n👤 ${studentName}\n📱 ${phone}\n🏫 ${university}\n🌍 ${country} · 📚 ${degree}\n📊 ${status}\n📅 ${createdDate}`,
  adminApplicationDetails: (applicationId, studentName, phone, telegramId, university, country, degree, status, createdDate, updatedDate) =>
    `👁 *Ariza #${applicationId}*\n\n👤 Talaba: ${studentName}\n📱 Telefon: ${phone}\n🆔 Telegram ID: ${telegramId}\n🏫 Universitet: ${university}\n🌍 Mamlakat: ${country}\n📚 Daraja: ${degree}\n📊 Holat: ${status}\n📅 Yaratilgan: ${createdDate}\n🔄 Yangilangan: ${updatedDate}`,
  adminViewButton: '👁 Ko\'rish',
  adminAcceptButton: '✅ Qabul qilish',
  adminRequestDocumentsButton: '📄 Hujjat so\'rash',
  adminRejectButton: '❌ Rad etish',
  adminApplicationNotFound: 'Ariza topilmadi.',
  adminStatusUpdated: (status) => `Holat yangilandi: ${status}`,
  adminDocumentsTitle: '📄 *So\'nggi hujjatlar*',
  adminNoDocuments: '📄 *Hujjatlar*\n\nHali hujjatlar yuklanmagan.',
  adminDocumentEntry: (number, studentName, documentType, fileName, status, uploadDate, applicationId) =>
    `*${number}.* ${documentType}\n👤 ${studentName}\n📎 ${fileName}\n📋 Ariza #${applicationId}\n🔍 ${status}\n📅 ${uploadDate}`,
  adminStudentsTitle: '👥 *So\'nggi talabalar*',
  adminNoStudents: '👥 *Talabalar*\n\nRo\'yxatdan o\'tgan talabalar yo\'q.',
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
    `📊 *Statistika*\n\n👥 Talabalar: ${totalUsers}\n📋 Arizalar: ${totalApplications}\n📄 Hujjatlar: ${totalDocuments}\n\n*Ariza voronkasi:*\n🔍 Ko\'rib chiqilmoqda: ${pendingReview}\n✅ Qabul qilindi: ${accepted}\n❌ Rad etildi: ${rejected}\n📄 Hujjatlar talab qilinadi: ${documentsRequired}\n⏳ Tekshiruvdagi hujjatlar: ${pendingDocuments}\n\n*Top mamlakatlar:*\n${topCountries}\n\n*Top universitetlar:*\n${topUniversities}`,
  adminSearch: '🔎 Talaba qidirish',
  adminSearchTitle: '🔎 *Talaba qidirish*\n\nQidiruv turini tanlang:',
  adminSearchByPhone: '📱 Telefon bo\'yicha',
  adminSearchByTelegramId: '🆔 Telegram ID bo\'yicha',
  adminSearchByName: '👤 Ism bo\'yicha',
  adminSearchPromptPhone: '📱 *Telefon bo\'yicha qidirish*\n\nTelefon raqamini kiriting (to\'liq yoki qisman):',
  adminSearchPromptTelegramId: '🆔 *Telegram ID bo\'yicha qidirish*\n\nRaqamli Telegram ID kiriting:',
  adminSearchPromptName: '👤 *Ism bo\'yicha qidirish*\n\nTalaba ismini kiriting (qisman mos kelishi):',
  adminSearchNoResults: 'So\'rovingiz bo\'yicha talabalar topilmadi.',
  adminSearchInvalidTelegramId: 'Noto\'g\'ri Telegram ID. Raqamli ID kiriting.',
  adminSearchResultsTitle: (count) => `🔎 *Qidiruv natijalari* (${count})`,
  adminChecklistIcon: (state) => {
    const icons = { missing: '❌', pending: '🔍', verified: '✅', rejected: '⚠' };
    return icons[state];
  },
  adminDocumentChecklistTitle: '📋 *Majburiy hujjatlar ro\'yxati:*',
  adminUploadedDocsTitle: '📎 *Yuklangan hujjatlar:*',
  adminMissingDocsTitle: '📭 *Yetishmayotgan hujjatlar:*',
  adminNoUploadedDocuments: '— Hali yo\'q',
  adminAllDocumentsUploaded: '— Barcha majburiy hujjatlar yuklangan',
  adminDocOpenButton: '👁 Ochish',
  adminDocVerifyButton: '✅ Tasdiqlash',
  adminDocRejectButton: '❌ Rad etish',
  adminDocumentNotFound: 'Hujjat topilmadi.',
  adminDocumentVerified: 'Hujjat tasdiqlandi',
  adminDocumentRejected: 'Hujjat rad etildi',
  adminDocumentOpened: 'Hujjat yuborildi',
  managerNewApplicationAlert: (studentName, phone, university, country, degree, createdDate, applicationId) =>
    `🆕 *Yangi ariza #${applicationId}*\n\n👤 ${studentName}\n📱 ${phone}\n🏫 ${university}\n🌍 ${country}\n📚 ${degree}\n📅 ${createdDate}`,
  managerNewDocumentAlert: (studentName, phone, university, country, degree, documentType, fileName, uploadDate, applicationId) =>
    `📄 *Yangi hujjat — Ariza #${applicationId}*\n\n👤 ${studentName}\n📱 ${phone}\n🏫 ${university}\n🌍 ${country} · 📚 ${degree}\n📎 ${documentType}: ${fileName}\n📅 ${uploadDate}`,
  notificationDocumentVerifiedTitle: 'Hujjat tasdiqlandi',
  notificationDocumentVerifiedMessage: (documentType) => `${documentType} tasdiqlandi`,
  notificationDocumentRejectedTitle: 'Hujjat rad etildi',
  notificationDocumentRejectedMessage: (documentType) => `${documentType} rad etildi`,
  appDetailPage: (university, country, degree, status, timeline, checklist, uploaded, missing, appId) =>
    `📋 *Mening arizam #${appId}*\n\n🏫 ${university}\n🌍 ${country}\n📚 ${degree}\n📊 ${status}\n\n📅 *Timeline:*\n${timeline}\n\n📋 *Majburiy hujjatlar:*\n${checklist}\n\n📎 *Yuklangan:*\n${uploaded}\n\n📭 *Yetishmaydi:*\n${missing}`,
  appNoTimeline: '— Hali voqealar yo\'q',
  appTimelineEntry: (date, fromStatus, toStatus) => `• ${date}: ${fromStatus} → ${toStatus}`,
  appRefreshButton: '🔄 Yangilash',
  appUploadMissingButton: '📄 Yetishmayotgan hujjatlarni yuklash',
  appContactManagerButton: '💬 Menejer bilan bog\'lanish',
  appRefreshed: 'Ariza yangilandi',
  appContactReference: (appId) => `Ma\'lumot: Ariza #${appId}`,
  adminDashboard: '📊 Menejer paneli',
  managerDashboardText: (today, month, pending, docsPending, rate, topCountries, topUniversities, activeStudents) =>
    `📊 *Menejer paneli*\n\n📅 Bugun: ${today}\n📆 Shu oy: ${month}\n🔍 Ko\'rib chiqilmoqda: ${pending}\n⏳ Hujjatlar: ${docsPending}\n✅ Qabul foizi: ${rate}%\n\n*Top mamlakatlar:*\n${topCountries}\n\n*Top universitetlar:*\n${topUniversities}\n\n*Faol talabalar:*\n${activeStudents}`,
  documentReminderTitle: 'Hujjat eslatmasi',
  documentReminderMessage: (days) => `Yetishmayotgan hujjatlarni yuklang (${days} kunlik eslatma).`,
  rateLimitExceeded: '⏳ Juda ko\'p so\'rov. Biroz kuting.',
  adminDocDownloadButton: '⬇ Yuklab olish',
  adminSearchByApplicationId: '📋 Ariza ID bo\'yicha',
  adminSearchByUniversity: '🏫 Universitet bo\'yicha',
  adminSearchByStatus: '📊 Status bo\'yicha',
  adminSearchPromptApplicationId: '📋 Ariza ID kiriting:',
  adminSearchPromptUniversity: '🏫 Universitet ID kiriting (masalan de-1):',
  adminSearchPromptStatus: '📊 Status kiriting (masalan reviewing):',
  adminSearchPageInfo: (page, totalPages, total) => `Sahifa ${page}/${totalPages} (${total} natija)`,
  adminSettings: '⚙ Sozlamalar',
  adminUniversities: '🏫 Universitetlar',
  adminBroadcasts: '📢 E\'lonlar',
  adminBackups: '💾 Zaxira nusxalar',
  adminIncidents: '🚨 Incidentlar',
  adminSettingsTitle: '⚙ *Sozlamalar*',
  adminSettingsManager: '👤 Manager username',
  adminSettingsReminder: '⏰ Eslatma intervali',
  adminSettingsStorage: '📦 Saqlash provayderi',
  adminSettingsNotifications: '🔔 Bildirishnomalar',
  adminSettingsMaintenance: '🛠 Texnik xizmat rejimi',
  adminSettingsUpdated: (key) => `Sozlama yangilandi: ${key}`,
  adminUniversitiesTitle: '🏫 *Universitetlar*',
  adminUniversityAdd: '➕ Qo\'shish',
  adminUniversityList: '📋 Ro\'yxat / O\'chirish',
  adminUniversityWizardCountry: 'Mamlakatni tanlang:',
  adminUniversityWizardDegree: 'Darajalarni tanlang:',
  adminUniversityWizardNameEn: 'Universitet nomi (EN):',
  adminUniversityWizardConfirm: 'Talablarni belgilang va saqlang:',
  adminUniversitySaved: (id) => `Universitet saqlandi: ${id}`,
  adminUniversityDeactivated: (id) => `Universitet o\'chirildi: ${id}`,
  adminBroadcastsTitle: '📢 *E\'lonlar*',
  adminBroadcastCreate: '➕ Yangi e\'lon',
  adminBroadcastAudienceAll: '👥 Barcha talabalar',
  adminBroadcastAudienceAccepted: '✅ Qabul qilinganlar',
  adminBroadcastAudienceReviewing: '🔍 Ko\'rib chiqilmoqda',
  adminBroadcastAudienceDocsRequired: '📄 Hujjat kerak',
  adminBroadcastEnterMessage: 'E\'lon matnini kiriting:',
  adminBroadcastPreview: (message, targets) => `*Ko\'rib chiqish*\n\n${message}\n\nQabul qiluvchilar: ${targets}`,
  adminBroadcastQueued: (id) => `E\'lon #${id} navbatga qo\'yildi`,
  adminBroadcastCancelled: (id) => `E\'lon #${id} bekor qilindi`,
  adminBackupsTitle: '💾 *Zaxira nusxalar*',
  adminBackupsStatus: (last, size, retention) =>
    `Oxirgi: ${last}\nDB hajmi: ${size}\nSaqlash: ${retention} kun`,
  adminBackupsRun: '▶ Zaxira yaratish',
  adminBackupsRestoreHint: 'Tiklash: `./scripts/restore-db.sh backups/<file>.sql`',
  adminSearchPrev: '⬅ Oldingi',
  adminSearchNext: 'Keyingi ➡',
  softLaunchBlocked: '⏳ Bot soft launch rejimida. Kirish cheklangan.',
  softLaunchMaxApplications: 'Soft launch davomida ariza limitiga yetdingiz.',

  orgApp: {
    menuApply: '🏛 Platformaga ariza',
    menuMyApplications: '📋 Arizalarim',

    intro:
      '🏛 *Platformaga qo\'shilish arizasi*\n\nTa\'lim muassasangizni platformaga ulash uchun ariza topshirasiz. 8 ta savol beraman, oxirida ustav nusxasini so\'rayman.\n\nHar qadamda ⬅️ bilan orqaga qaytishingiz mumkin.',
    stepHint: (current, total) => `Qadam ${current} / ${total}`,

    askOrgType: '🏫 Muassasa turini tanlang:',
    orgTypeLabels: {
      university: '🎓 Universitet',
      institute: '🏛 Institut',
      college: '🏫 Kollej',
      'training-center': '📚 O\'quv markazi',
      'corporate-academy': '🏢 Korporativ akademiya',
      other: '📄 Boshqa',
    },
    askOrgName: '✍️ Muassasaning *to\'liq rasmiy nomini* yozing (ustavdagidek):',
    askStir:
      '🔢 *STIR* (soliq to\'lovchi identifikatsiya raqami) ni yozing.\n\nFaqat raqamlar, 9–14 xona. Bo\'shliq va chiziqchalarni o\'zim tozalaymen.',
    askLastName: '👤 Mas\'ul shaxsning *familiyasini* yozing:',
    askFirstName: '👤 Mas\'ul shaxsning *ismini* yozing:',
    askMiddleName:
      '👤 Mas\'ul shaxsning *otasining ismini* (sharifini) yozing.\n\nSharif bo\'lmasa — «O\'tkazib yuborish» tugmasini bosing.',
    askPhone:
      '📞 Mas\'ul shaxsning *telefon raqamini* yozing yoki tugma bilan ulashing.\n\nMasalan: `901234567` yoki `+998901234567`',
    askCharter:
      '📎 *Ustav nusxasini* yuboring (fayl sifatida).\n\nRuxsat etilgan turlar: PDF, JPG, PNG. Eng katta hajm: 20 MB.\n\n⚠️ Rasmni «foto» emas, *fayl* sifatida yuborsangiz sifati saqlanadi.',

    confirmTitle: '✅ *Arizani tekshirib chiqing*',
    summary: (f) =>
      `🏫 Turi: *${f.organizationType}*\n` +
      `🏛 Nomi: *${f.organizationName}*\n` +
      `🔢 STIR: \`${f.stir}\`\n` +
      `👤 Mas'ul: *${f.responsibleFullName}*\n` +
      `📞 Telefon: \`${f.phone}\`\n` +
      `📎 Ustav: ${f.charterFileName}`,

    buttonBack: '⬅️ Orqaga',
    buttonCancel: '❌ Bekor qilish',
    buttonSkip: '⏭ O\'tkazib yuborish',
    buttonSubmit: '📨 Arizani yuborish',
    buttonSharePhone: '📞 Raqamni ulashish',

    cancelled: '❌ Ariza bekor qilindi. Qaytadan boshlash uchun menyudan foydalaning.',
    alreadyInProgress:
      'Sizda tugallanmagan ariza bor. Uni davom ettiring yoki ❌ Bekor qilish tugmasini bosing.',

    errorRequired: '❌ Bu maydon bo\'sh qolmasligi kerak. Qaytadan yozing.',
    errorTooLong: '❌ Juda uzun. Qisqartirib yozing.',
    errorStirFormat: '❌ STIR faqat raqamlardan, 9–14 xonadan iborat bo\'lishi kerak.',
    errorPhoneFormat: '❌ Telefon raqami tushunarsiz. Masalan: `901234567`',
    errorFileType: '❌ Faqat PDF, JPG yoki PNG fayl yuboring.',
    errorFileTooLarge: '❌ Fayl 20 MB dan katta. Kichikroq nusxa yuboring.',
    errorExpectDocument: '📎 Hozir fayl kutilmoqda — ustav nusxasini yuboring.',
    errorPickFromButtons: 'Iltimos, yuqoridagi tugmalardan birini tanlang.',

    submitting: '⏳ Ariza yuborilmoqda...',
    submitted: (applicationId) =>
      `✅ *Ariza qabul qilindi!*\n\nAriza raqami: \`${applicationId}\`\n\nEndi platforma admini uni ko'rib chiqadi. Har bir o'zgarishdan sizni shu yerda xabardor qilaman.`,
    submitFailedStirTaken:
      '⚠️ Bu STIR bo\'yicha ariza allaqachon mavjud.\n\nAgar bu sizning muassasangiz bo\'lsa — platforma admini bilan bog\'laning.',
    submitFailedValidation:
      '❌ Ariza qabul qilinmadi: ma\'lumotlarda xatolik bor. Qaytadan urinib ko\'ring.',
    submitFailedUnavailable:
      '⚠️ Platforma hozir javob bermayapti. Ma\'lumotlaringiz saqlanmadi — birozdan keyin qayta urinib ko\'ring.',

    statusLabels: {
      submitted: '📤 Yuborilgan',
      verify_failed: '❌ Tekshiruvdan o\'tmadi',
      in_review: '🔍 Ko\'rib chiqilmoqda',
      pa_rejected: '❌ Platforma admini rad etdi',
      awaiting_owner: '⏳ Tasdiqlash kutilmoqda',
      owner_approved: '✅ Tasdiqlandi',
      rejected: '❌ Rad etildi',
      needs_correction: '✏️ Tuzatish talab qilinadi',
      activated: '🎉 Faollashtirildi',
      archived: '📦 Arxivlandi',
    },
    statusChanged: (organizationName, statusLabel) =>
      `📬 *Ariza holati o'zgardi*\n\n🏛 ${organizationName}\n📊 ${statusLabel}`,
    statusReason: (reason) => `\n\n💬 Izoh: ${reason}`,
    activatedExtra:
      '\n\nMuassasangiz platformada faollashtirildi. Rektor hisobi va kirish ma\'lumotlari *bot orqali emas*, alohida yetkaziladi.',
    actionNeededExtra:
      '\n\n⚠️ Bu bosqichda *sizdan harakat kutilmoqda*. Izohni o\'qing, kamchilikni tuzating va platforma admini bilan bog\'laning.',
    rejectedExtra:
      '\n\n⚠️ Bu yakuniy qaror. Ayni STIR raqami band bo\'lib qoladi, shuning uchun yangi ariza avtomatik qabul qilinmaydi — platforma admini bilan bog\'laning.',

    myApplicationsTitle: '📋 *Arizalarim*',
    myApplicationsEmpty:
      '📋 *Arizalarim*\n\nHozircha arizangiz yo\'q.\n\nAriza topshirish uchun 🏛 Platformaga ariza bo\'limiga o\'ting.',
    myApplicationEntry: (f) =>
      `*${f.index}.* ${f.organizationName}\n🏫 ${f.organizationType} · 🔢 \`${f.stir}\`\n📅 ${f.submittedDate}\n📊 ${f.statusLabel}`,
  },
};
