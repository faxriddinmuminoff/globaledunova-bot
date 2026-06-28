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
    sent_to_university: '🏫 Universitetga yuborilgan',
    accepted: '✅ Qabul qilingan',
    rejected: '❌ Rad etilgan',
    visa_processing: '🛂 Viza rasmiylashtirilmoqda',
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
};
