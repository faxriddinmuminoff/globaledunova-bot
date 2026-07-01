import { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import { adminTelegramIds, isStaging, managerChatId, config } from '../config';
import { logger } from '../logger';
import { getNotificationBot } from './application-status.service';
import { sendTelegramMessage } from '../telegram/telegram-client';
import { applicationActionKeyboard } from '../bot/keyboards/admin.keyboard';
import { Language } from '../types';
import { ApplicationWithStudent, DocumentWithStudent } from '../admin/types';
import {
  formatApplicationAlertSummary,
  formatAdminDate,
  getDegreeLabel,
} from '../admin/formatters';
import { getUniversityById } from '../universities/university.service';
import { t } from '../i18n';
import { findApplicationWithStudentById } from '../database/repositories/admin.repository';

function getAlertTargets(): number[] {
  if (managerChatId !== undefined) {
    return [managerChatId];
  }
  return adminTelegramIds;
}

async function sendManagerMessage(
  text: string,
  extra?: ExtraReplyMessage,
): Promise<void> {
  const bot = getNotificationBot();
  if (!bot) {
    logger.warn('Bot instance not set — manager alert not delivered');
    return;
  }

  const targets = getAlertTargets();
  if (targets.length === 0) {
    logger.debug('No manager alert targets configured');
    return;
  }

  for (const chatId of targets) {
    await sendTelegramMessage({
      bot,
      chatId,
      text,
      extra,
      fake: isStaging && config.STAGING_FAKE_MANAGER_ALERTS,
    });
  }
}

export async function notifyManagerNewApplication(
  application: ApplicationWithStudent,
): Promise<void> {
  const language: Language = 'en';
  const text = await formatApplicationAlertSummary(application, language);

  await sendManagerMessage(text, {
    parse_mode: 'Markdown',
    ...applicationActionKeyboard(application.id, language),
  });
}

export async function notifyManagerNewDocument(
  document: DocumentWithStudent,
  applicationId: number,
): Promise<void> {
  const language: Language = 'en';
  const texts = t(language);
  const application = await findApplicationWithStudentById(applicationId);

  if (!application) {
    logger.warn({ applicationId, documentId: document.id }, 'Application not found for document alert');
    return;
  }

  const university = await getUniversityById(application.university_id, language);
  const text = texts.managerNewDocumentAlert(
    document.student_name ?? '—',
    application.student_phone ?? '—',
    university?.name ?? application.university_id,
    texts.countries[application.country],
    getDegreeLabel(language, application.degree),
    texts.documentTypes[document.document_type],
    document.original_file_name,
    formatAdminDate(document.uploaded_at, language),
    application.id,
  );

  await sendManagerMessage(text, {
    parse_mode: 'Markdown',
    ...applicationActionKeyboard(application.id, language),
  });
}
