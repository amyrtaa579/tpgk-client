import { Context, Keyboard } from '@maxhub/max-bot-api';
const button = Keyboard.button;
import type { InlineKeyboardAttachmentRequest } from '@maxhub/max-bot-api/types';
import { APIClient } from '../services/apiClient';
import { safeEditMessage, formatCaption, editMessageWithPhoto } from '../utils/helpers';
import { answerCallback, getUserId } from '../utils/contextHelpers';
import { specialtyFactsKeyboard } from '../keyboards/inline';

// Хранилище состояний для фактов
const factState = new Map<string, { factId: number; code: string; imageIndex: number }>();

function getUserStateKey(userId: number, chatId: number): string {
  return `fact:${userId}:${chatId}`;
}

export async function handleSpecialtyFacts(
  ctx: Context,
  apiClient: APIClient,
  code: string,
): Promise<void> {
  try {
    const facts = await apiClient.getSpecialtyFacts(code);

    if (!facts || facts.length === 0) {
      const text = '<b>Интересные факты</b>\n\nК сожалению, факты для этой специальности пока не добавлены.';
      const keyboard = specialtyFactsKeyboard([], code);
      await safeEditMessage(ctx, text, keyboard);
      return;
    }

    const textParts = ['<b>Интересные факты</b>', ''];
    for (let i = 0; i < facts.length; i++) {
      textParts.push(`${i + 1}. <b>${facts[i].title}</b>`, '');
    }
    textParts.push('Выберите номер:');
    const text = textParts.join('\n').trimEnd();

    const keyboard = specialtyFactsKeyboard(facts, code);
    await safeEditMessage(ctx, text, keyboard);
  } catch (err: any) {
    await answerCallback(ctx, { notification: `Ошибка: ${err.message}` });
  }
}

export async function handleFactDetail(
  ctx: Context,
  apiClient: APIClient,
  factId: number,
  code: string,
): Promise<void> {
  try {
    const fact = await apiClient.getFactById(factId);
    console.log(`[FACT DETAIL] ID: ${factId}, images count: ${fact.images?.length || 0}`);
    if (fact.images) {
      fact.images.forEach((img, i) => console.log(`[FACT DETAIL] Image ${i}: ${img.url}`));
    }

    const userId = getUserId(ctx);
    const chatId = ctx.chatId || 0;
    const key = getUserStateKey(userId, chatId);
    factState.set(key, { factId, code, imageIndex: 0 });

    const textParts = [`<b>${fact.title}</b>`, ''];
    if (fact.description) {
      for (const desc of fact.description) {
        textParts.push(`• ${desc}`, '');
      }
    }
    const text = textParts.join('\n').trimEnd();

    const totalImages = fact.images ? fact.images.length : 0;
    const keyboard = buildFactKeyboard(code, totalImages, 0);

    if (totalImages > 0) {
      const image = fact.images[0];
      const caption = formatCaption(text, image.caption);
      await editMessageWithPhoto(ctx, image.url, caption, keyboard);
    } else {
      await safeEditMessage(ctx, text, keyboard);
    }
  } catch (err: any) {
    await answerCallback(ctx, { notification: `Ошибка: ${err.message}` });
  }
}

export async function handleFactImageNav(
  ctx: Context,
  apiClient: APIClient,
  direction: 'back' | 'forward',
): Promise<void> {
  const userId = getUserId(ctx);
  const chatId = ctx.chatId || 0;
  const key = getUserStateKey(userId, chatId);
  const state = factState.get(key);

  if (!state) {
    await answerCallback(ctx, { notification: 'Ошибка: данные не найдены' });
    return;
  }

  try {
    const fact = await apiClient.getFactById(state.factId);
    const totalImages = fact.images ? fact.images.length : 0;

    let newIndex = state.imageIndex;
    if (direction === 'back') {
      newIndex = Math.max(0, state.imageIndex - 1);
    } else {
      newIndex = Math.min(totalImages - 1, state.imageIndex + 1);
    }

    state.imageIndex = newIndex;
    factState.set(key, state);

    const textParts = [`<b>${fact.title}</b>`, ''];
    if (fact.description) {
      for (const desc of fact.description) {
        textParts.push(`• ${desc}`, '');
      }
    }
    const text = textParts.join('\n').trimEnd();

    const keyboard = buildFactKeyboard(state.code, totalImages, newIndex);

    if (totalImages > 0) {
      const image = fact.images[newIndex];
      let caption = formatCaption(text, image.caption);
      if (totalImages > 1) {
        caption = `[${newIndex + 1}/${totalImages}] ${caption}`;
      }
      // Отправляем новое изображение с клавиатурой через ctx.reply
      const imageAttachment = await ctx.api.uploadImage({ url: image.url });
      await ctx.reply(caption, {
        format: 'html',
        attachments: [imageAttachment.toJson(), keyboard],
      });
    }
    await answerCallback(ctx, {});
  } catch (err: any) {
    await answerCallback(ctx, { notification: `Ошибка: ${err.message}` });
  }
}

function buildFactKeyboard(
  code: string,
  totalImages: number,
  imageIndex: number,
): InlineKeyboardAttachmentRequest {
  const builder: any[][] = [];

  if (totalImages > 1) {
    const navRow: any[] = [];
    if (imageIndex > 0) {
      navRow.push(button.callback('⬅️', `fact:image:back:${imageIndex}`));
    }
    if (imageIndex < totalImages - 1) {
      navRow.push(button.callback('➡️', `fact:image:forward:${imageIndex}`));
    }
    if (navRow.length > 0) {
      builder.push(navRow);
    }
  }

  builder.push([button.callback('⬅️ К списку фактов', `specialty:facts:${code}`)]);
  return Keyboard.inlineKeyboard(builder);
}
