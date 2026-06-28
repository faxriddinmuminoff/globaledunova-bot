import { Translations } from '../../types';

export const ru: Translations = {
  welcome: '👋 Добро пожаловать в GlobalEduNova!\n\nМы помогаем студентам поступать в университеты по всему миру. Выберите язык:',
  languageSelected: '✅ Язык установлен: Русский.',
  sharePhone: '📱 Пожалуйста, поделитесь номером телефона, чтобы мы могли связаться с вами по поводу заявок.',
  phoneReceived: '✅ Номер телефона успешно сохранён!',
  mainMenu: '🏠 Главное меню\n\nВыберите опцию:',
  universities: '🎓 Университеты',
  myApplications: '📋 Мои заявки',
  documents: '📄 Документы',
  myDocuments: '📄 Мои документы',
  notifications: '📬 Уведомления',
  contactManager: '💬 Связаться с менеджером',
  profile: '⚙️ Профиль',
  sharePhoneButton: '📱 Поделиться номером',
  backToMenu: '◀️ В главное меню',
  contactManagerText: (username?: string) =>
    username
      ? `💬 *Связаться с менеджером*\n\nНужна помощь? Напишите нашему менеджеру:\n@${username}`
      : '💬 *Связаться с менеджером*\n\nНужна помощь? Наш менеджер свяжется с вами в ближайшее время.',
  profileText: (name: string, phone: string, language: string) =>
    `⚙️ *Ваш профиль*\n\n👤 Имя: ${name}\n📱 Телефон: ${phone}\n🌐 Язык: ${language}`,
  invalidPhone: '❌ Пожалуйста, используйте кнопку ниже для отправки номера телефона.',
  errorGeneric: '❌ Что-то пошло не так. Попробуйте позже.',
  changeLanguage: '🌐 Сменить язык',
  languages: {
    en: '🇬🇧 English',
    ru: '🇷🇺 Русский',
    uz: '🇺🇿 O\'zbekcha',
  },
  selectCountry: '🌍 *Выберите страну*\n\nВыберите страну, где хотите учиться:',
  selectDegree: '📚 *Выберите степень*\n\nВыберите уровень образования:',
  degreeBachelor: '🎓 Бакалавриат',
  degreeMaster: '🎓 Магистратура',
  degreePhd: '🎓 Докторантура (PhD)',
  countries: {
    de: '🇩🇪 Германия',
    hu: '🇭🇺 Венгрия',
    pl: '🇵🇱 Польша',
    it: '🇮🇹 Италия',
    tr: '🇹🇷 Турция',
  },
  universityListHeader: (country, degree) =>
    `🏫 *Университеты в ${country}*\n📚 Программа: *${degree}*\n\nВыберите университет для подачи заявки:`,
  universityCard: (number, name, city) =>
    `*${number}. ${name}*\n📍 ${city}`,
  applyButton: '📝 Подать заявку',
  applicationSuccess: (university, country, degree) =>
    `✅ Заявка отправлена!\n\n🏫 ${university}\n🌍 ${country}\n📚 ${degree}\n\nНаша команда скоро свяжется с вами.`,
  applicationDuplicate: 'Вы уже подавали заявку в этот университет на данную программу.',
  applicationsListTitle: '📋 *Мои заявки*',
  noApplicationsYet:
    '📋 *Мои заявки*\n\nУ вас пока нет активных заявок.\n\nПерейдите в 🎓 Университеты, чтобы подать заявку.',
  applicationEntry: (number, university, country, degree, date, status) =>
    `*${number}.* ${university}\n🌍 ${country} · 📚 ${degree}\n📅 ${date}\n📊 ${status}`,
  applicationStatuses: {
    draft: '📝 Черновик',
    submitted: '📤 Подана',
    reviewing: '🔍 На рассмотрении',
    documents_required: '📄 Требуются документы',
    sent_to_university: '🏫 Отправлена в университет',
    accepted: '✅ Принята',
    rejected: '❌ Отклонена',
    visa_processing: '🛂 Оформление визы',
    completed: '🎉 Завершена',
  },
  backToCountries: '◀️ К выбору страны',
  backToDegrees: '◀️ К выбору степени',
  noApplicationsForDocuments:
    '📄 *Документы*\n\nУ вас пока нет заявок.\n\nСначала подайте заявку через 🎓 Университеты.',
  selectApplicationForDocument:
    '📄 *Загрузка документа*\n\nВыберите заявку, для которой хотите загрузить документ:',
  selectDocumentType: '📄 *Тип документа*\n\nВыберите тип документа для загрузки:',
  documentTypes: {
    passport: '🛂 Паспорт',
    diploma: '🎓 Диплом',
    transcript: '📜 Транскрипт (оценки)',
    ielts: '📝 Сертификат IELTS',
    motivation_letter: '✉️ Мотивационное письмо',
    photo: '📷 Фотография',
  },
  uploadDocumentPrompt: (documentType, applicationLabel) =>
    `📤 *Загрузка: ${documentType}*\n\nЗаявка: *${applicationLabel}*\n\nОтправьте PDF-файл или изображение (JPG, PNG, WEBP).\n\nМаксимальный размер: 20 МБ.`,
  documentUploadSuccess: (documentType, fileName) =>
    `✅ *Документ успешно загружен!*\n\n📄 Тип: ${documentType}\n📎 Файл: ${fileName}\n⏳ Статус: Ожидает проверки`,
  documentUploadDuplicate:
    'Вы уже загружали этот тип документа для выбранной заявки.',
  invalidFileType:
    '❌ Неверный тип файла. Отправьте PDF или изображение (JPG, PNG, WEBP).',
  fileTooLarge: '❌ Файл слишком большой. Максимальный размер — 20 МБ.',
  pleaseUploadFile: '📤 Пожалуйста, отправьте PDF-файл или изображение.',
  applicationNotFound: '❌ Заявка не найдена. Начните заново через 📄 Документы.',
  myDocumentsTitle: '📄 *Мои документы*',
  noDocumentsYet:
    '📄 *Мои документы*\n\nДокументы пока не загружены.\n\nПерейдите в 📄 Документы, чтобы загрузить файлы.',
  myDocumentEntry: (number, documentType, uploadDate, status, fileName) =>
    `*${number}.* ${documentType}\n📎 ${fileName}\n📅 ${uploadDate}\n🔍 ${status}`,
  documentStatusPending: '⏳ Ожидает проверки',
  documentStatusVerified: '✅ Подтверждён',
  documentStatusRejected: '❌ Отклонён',
  cancelUpload: '✖️ Отмена',
  uploadCancelled: 'Загрузка отменена.',
  notificationsWithCount: (count) => `📬 Уведомления (${count})`,
  notificationsListTitle: '📬 *Уведомления*',
  notificationsListTitleWithUnread: (count) => `📬 *Уведомления* (${count} непрочит.)`,
  noNotificationsYet: '📬 *Уведомления*\n\nУ вас пока нет уведомлений.',
  notificationEntry: (number, title, message, date, readStatus) =>
    `${readStatus} *${number}.* ${title}\n${message}\n📅 ${date}`,
  notificationRead: '✅',
  notificationUnread: '🔵',
  markAllNotificationsRead: '✅ Отметить все как прочитанные',
  clearAllNotifications: '🗑 Очистить все уведомления',
  notificationMarkedRead: 'Уведомление отмечено как прочитанное',
  allNotificationsMarkedRead: (count) => `${count} уведомлений отмечено как прочитанные`,
  noUnreadNotifications: 'Нет непрочитанных уведомлений',
  notificationsCleared: (count) => `${count} уведомлений удалено`,
  notificationNotFound: 'Уведомление не найдено',
  notificationStatusChangeTitle: 'Статус заявки обновлён',
  notificationStatusChangeMessage: (university, previousStatus, newStatus) =>
    `Статус вашей заявки в *${university}* изменён.\n\nБыло: ${previousStatus}\nСтало: *${newStatus}*`,
  notificationApplicationSubmittedTitle: 'Заявка подана',
  notificationApplicationSubmittedMessage: (university, status) =>
    `Ваша заявка в *${university}* успешно подана.\n\nТекущий статус: *${status}*`,
};
