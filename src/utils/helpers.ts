import { Context } from '@maxhub/max-bot-api';
import type { InlineKeyboardAttachmentRequest } from '@maxhub/max-bot-api/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Скачивает файл по URL во временную папку.
 */
async function downloadToTemp(url: string, ext: string = ''): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const tmpPath = path.join(os.tmpdir(), `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  fs.writeFileSync(tmpPath, buffer);
  return tmpPath;
}

/**
 * Определяет расширение файла по URL.
 */
function getExtFromUrl(url: string): string {
  const match = url.match(/\.(png|jpg|jpeg|gif|webp|pdf|docx?|xlsx?|txt)(\?|$)/i);
  return match ? match[0].split('?')[0] : '';
}

/**
 * Отправить фото по URL с клавиатурой.
 * Скачивает картинку локально и загружает как изображение (inline).
 */
export async function editMessageWithPhoto(
  ctx: Context,
  imageUrl: string,
  caption: string,
  keyboard: InlineKeyboardAttachmentRequest,
): Promise<void> {
  let tmpPath = '';
  try {
    console.log(`[IMG] Скачиваю изображение: ${imageUrl}`);
    tmpPath = await downloadToTemp(imageUrl, getExtFromUrl(imageUrl));
    console.log(`[IMG] Сохранено: ${tmpPath}`);

    // Загружаем как ИЗОБРАЖЕНИЕ (не файл), чтобы отображалось inline
    const imageAttachment = await ctx.api.uploadImage({ source: tmpPath });
    console.log(`[IMG] Загружено в Max Bot как изображение`);

    try {
      await ctx.editMessage({
        text: caption,
        attachments: [imageAttachment.toJson(), keyboard],
        format: 'html',
      } as any);
    } catch {
      const messageId = ctx.messageId;
      if (messageId) {
        try { await ctx.deleteMessage(messageId); } catch {}
      }
      await ctx.reply(caption, {
        format: 'html',
        attachments: [imageAttachment.toJson(), keyboard] as any,
      });
    }
  } catch (err: any) {
    console.error(`[IMG] Ошибка: ${err.message}`);
    throw err;
  } finally {
    if (tmpPath) {
      try { fs.unlinkSync(tmpPath); } catch {}
    }
  }
}

/**
 * Отправить фото по URL без клавиатуры.
 */
export async function editPhotoOnly(
  ctx: Context,
  imageUrl: string,
  caption: string,
): Promise<void> {
  let tmpPath = '';
  try {
    tmpPath = await downloadToTemp(imageUrl, getExtFromUrl(imageUrl));
    const imageAttachment = await ctx.api.uploadImage({ source: tmpPath });

    try {
      await ctx.editMessage({
        text: caption,
        attachments: [imageAttachment.toJson()],
        format: 'html',
      } as any);
    } catch {
      const messageId = ctx.messageId;
      if (messageId) {
        try { await ctx.deleteMessage(messageId); } catch {}
      }
      await ctx.reply(caption, {
        format: 'html',
        attachments: [imageAttachment.toJson()] as any,
      });
    }
  } finally {
    if (tmpPath) {
      try { fs.unlinkSync(tmpPath); } catch {}
    }
  }
}

/**
 * Отправить файл по URL.
 */
export async function editMessageWithFile(
  ctx: Context,
  fileUrl: string,
  fileName: string,
  caption: string,
  keyboard?: InlineKeyboardAttachmentRequest,
): Promise<void> {
  let tmpPath = '';
  try {
    console.log(`[FILE] Загрузка файла: ${fileUrl}`);
    tmpPath = await downloadToTemp(fileUrl, getExtFromUrl(fileUrl) || `.${fileName.split('.').pop()}`);
    console.log(`[FILE] Файл сохранён: ${tmpPath}`);

    const fileAttachment = await ctx.api.uploadFile({ source: tmpPath });

    const attachments: any[] = [fileAttachment.toJson()];
    if (keyboard) attachments.push(keyboard);

    try {
      await ctx.editMessage({
        text: caption,
        attachments,
        format: 'html',
      } as any);
    } catch (err: any) {
      console.error(`[FILE] editMessage ошибка: ${err.message}`);
      const messageId = ctx.messageId;
      if (messageId) {
        try { await ctx.deleteMessage(messageId); } catch {}
      }
      await ctx.reply(caption, {
        format: 'html',
        attachments: attachments as any,
      });
    }
  } catch (err: any) {
    console.error(`[FILE] Ошибка: ${err.message}`);
    throw err;
  } finally {
    if (tmpPath) {
      try { fs.unlinkSync(tmpPath); } catch {}
    }
  }
}

/**
 * Безопасное редактирование сообщения.
 */
export async function safeEditMessage(
  ctx: Context,
  text: string,
  keyboard: InlineKeyboardAttachmentRequest,
  format: 'html' | 'markdown' = 'html',
): Promise<void> {
  const messageId = ctx.messageId;
  if (!messageId) {
    await ctx.reply(text, {
      format,
      attachments: [keyboard],
    });
    return;
  }

  try {
    await ctx.editMessage({
      text,
      attachments: [keyboard],
      format,
    } as any);
  } catch {
    try {
      await ctx.deleteMessage(messageId);
    } catch {
      // ignore
    }
    await ctx.reply(text, {
      format,
      attachments: [keyboard],
    });
  }
}

/**
 * Форматирование текста с изображением.
 */
export function formatCaption(text: string, imageCaption?: string | null): string {
  let caption = imageCaption ? `${text}\n\n<i>${imageCaption}</i>` : text;
  if (caption.length > 1024) {
    caption = caption.slice(0, 1021) + '...';
  }
  return caption;
}

/**
 * Прогресс-бар.
 */
export function progressBar(current: number, total: number): string {
  const filled = '🟩'.repeat(current);
  const empty = '⬜'.repeat(total - current);
  return filled + empty;
}
