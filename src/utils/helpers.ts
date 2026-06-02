import { Context } from '@maxhub/max-bot-api';
import type { InlineKeyboardAttachmentRequest } from '@maxhub/max-bot-api/types';

/**
 * Отправить фото по URL с клавиатурой (редактируя текущее сообщение).
 */
export async function editMessageWithPhoto(
  ctx: Context,
  imageUrl: string,
  caption: string,
  keyboard: InlineKeyboardAttachmentRequest,
): Promise<void> {
  const imageAttachment = await ctx.api.uploadImage({ url: imageUrl });

  try {
    await ctx.editMessage({
      text: caption,
      attachments: [imageAttachment.toJson(), keyboard],
      format: 'html',
    } as any);
  } catch {
    // При ошибке удаляем и отправляем новое
    const messageId = ctx.messageId;
    if (messageId) {
      try { await ctx.deleteMessage(messageId); } catch {}
    }
    await ctx.reply(caption, {
      format: 'html',
      attachments: [imageAttachment.toJson(), keyboard] as any,
    });
  }
}

/**
 * Отправить фото по URL без клавиатуры (редактируя текущее сообщение).
 */
export async function editPhotoOnly(
  ctx: Context,
  imageUrl: string,
  caption: string,
): Promise<void> {
  const imageAttachment = await ctx.api.uploadImage({ url: imageUrl });

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
}

/**
 * Отправить файл по URL (редактируя текущее сообщение).
 */
export async function editMessageWithFile(
  ctx: Context,
  fileUrl: string,
  fileName: string,
  caption: string,
  keyboard?: InlineKeyboardAttachmentRequest,
): Promise<void> {
  console.log(`[FILE] Загрузка файла: ${fileUrl}`);

  let tmpPath = '';
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    tmpPath = `/tmp/${Date.now()}_${fileName}`;
    require('fs').writeFileSync(tmpPath, buffer);
    console.log(`[FILE] Файл сохранён: ${tmpPath}`);

    const fileAttachment = await ctx.api.uploadFile({ source: tmpPath });
    console.log(`[FILE] Файл загружен в API, attachment: ${JSON.stringify(fileAttachment.toJson())}`);

    const attachments: any[] = [fileAttachment.toJson()];
    if (keyboard) attachments.push(keyboard);

    console.log(`[FILE] Отправка сообщения через editMessage`);
    try {
      await ctx.editMessage({
        text: caption,
        attachments,
        format: 'html',
      } as any);
      console.log(`[FILE] editMessage успешен`);
    } catch (err: any) {
      console.error(`[FILE] editMessage ошибка: ${err.message}`);
      const messageId = ctx.messageId;
      if (messageId) {
        try { await ctx.deleteMessage(messageId); } catch {}
      }
      console.log(`[FILE] Отправка сообщения через reply`);
      await ctx.reply(caption, {
        format: 'html',
        attachments: attachments as any,
      });
      console.log(`[FILE] reply успешен`);
    }
  } catch (err: any) {
    console.error(`[FILE] Ошибка: ${err.message}`);
    throw err;
  } finally {
    if (tmpPath) {
      try { require('fs').unlinkSync(tmpPath); } catch {}
    }
  }
}

/**
 * Безопасное редактирование сообщения: пытается edit, при ошибке — delete + send.
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
 * Форматирование текста с изображением (ограничение caption до 1024 символов).
 */
export function formatCaption(text: string, imageCaption?: string | null): string {
  let caption = imageCaption ? `${text}\n\n<i>${imageCaption}</i>` : text;
  if (caption.length > 1024) {
    caption = caption.slice(0, 1021) + '...';
  }
  return caption;
}

/**
 * Прогресс-бар из эмодзи.
 */
export function progressBar(current: number, total: number): string {
  const filled = '🟩'.repeat(current);
  const empty = '⬜'.repeat(total - current);
  return filled + empty;
}
