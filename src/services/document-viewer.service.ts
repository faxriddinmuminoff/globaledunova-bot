import { Telegraf } from 'telegraf';
import { getNotificationBot } from './application-status.service';
import { findDocumentById } from '../database/repositories/document.repository';
import { logger } from '../logger';

export interface DocumentDeliveryResult {
  success: boolean;
  method: 'sendDocument' | 'sendPhoto' | 'fileLink';
  fileLink?: string;
}

async function getBot(): Promise<Telegraf | null> {
  return getNotificationBot();
}

export async function openDocumentForAdmin(
  chatId: number,
  documentId: number,
): Promise<DocumentDeliveryResult> {
  const document = await findDocumentById(documentId);
  if (!document) return { success: false, method: 'sendDocument' };

  const bot = await getBot();
  if (!bot) return { success: false, method: 'sendDocument' };

  try {
    if (document.original_file_name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      await bot.telegram.sendPhoto(chatId, document.telegram_file_id, {
        caption: document.original_file_name,
      });
      return { success: true, method: 'sendPhoto' };
    }

    await bot.telegram.sendDocument(chatId, document.telegram_file_id, {
      caption: document.original_file_name,
    });
    return { success: true, method: 'sendDocument' };
  } catch (error) {
    logger.warn({ error, documentId }, 'sendDocument failed, trying getFileLink');
    return sendDocumentViaLink(chatId, document.telegram_file_id, bot);
  }
}

async function sendDocumentViaLink(
  chatId: number,
  fileId: string,
  bot: Telegraf,
): Promise<DocumentDeliveryResult> {
  try {
    const link = await bot.telegram.getFileLink(fileId);
    await bot.telegram.sendMessage(chatId, `📎 Download: ${link.href}`);
    return { success: true, method: 'fileLink', fileLink: link.href };
  } catch (error) {
    logger.error({ error, fileId }, 'getFileLink fallback failed');
    return { success: false, method: 'fileLink' };
  }
}

export async function forwardDocumentToChat(
  targetChatId: number,
  fromChatId: number,
  messageId: number,
): Promise<boolean> {
  const bot = await getBot();
  if (!bot) return false;

  try {
    await bot.telegram.forwardMessage(targetChatId, fromChatId, messageId);
    return true;
  } catch (error) {
    logger.error({ error, targetChatId, messageId }, 'Failed to forward document');
    return false;
  }
}

export async function downloadDocumentLink(documentId: number): Promise<string | null> {
  const document = await findDocumentById(documentId);
  if (!document) return null;

  const bot = await getBot();
  if (!bot) return null;

  try {
    const link = await bot.telegram.getFileLink(document.telegram_file_id);
    return link.href;
  } catch (error) {
    logger.error({ error, documentId }, 'Failed to get document download link');
    return null;
  }
}
