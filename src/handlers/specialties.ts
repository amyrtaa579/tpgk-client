import { Context } from '@maxhub/max-bot-api';
import { APIClient } from '../services/apiClient';
import { safeEditMessage, formatCaption, editMessageWithPhoto } from '../utils/helpers';
import { answerCallback } from '../utils/contextHelpers';
import {
  specialtyDetailKeyboard,
  specialtyFactsKeyboard,
  specialtiesListKeyboard,
} from '../keyboards/inline';

export async function handleSpecialtiesMenu(ctx: Context, apiClient: APIClient): Promise<void> {
  await showSpecialtiesList(ctx, apiClient, 1);
}

export async function showSpecialtiesList(
  ctx: Context,
  apiClient: APIClient,
  page: number = 1,
  limit: number = 10,
): Promise<void> {
  try {
    const response = await apiClient.getSpecialties({ page, limit });
    const items = response.items;
    const totalPages = response.total > 0 ? Math.ceil(response.total / limit) : 1;

    if (!items || items.length === 0) {
      await answerCallback(ctx, { notification: 'Специальности не найдены' });
      return;
    }

    const textParts = [`<b>Специальности</b> (стр. ${page}/${totalPages})`, ''];
    for (let i = 0; i < items.length; i++) {
      textParts.push(`${i + 1}. <b>${items[i].code}</b> — ${items[i].name}`, '');
    }
    textParts.push('Выберите номер:');
    const text = textParts.join('\n').trimEnd();

    const keyboard = specialtiesListKeyboard(items, page, totalPages);
    await safeEditMessage(ctx, text, keyboard);
  } catch (err: any) {
    await answerCallback(ctx, { notification: `Ошибка: ${err.message}` });
  }
}

export async function handleSpecialtyPage(
  ctx: Context,
  apiClient: APIClient,
  page: number,
): Promise<void> {
  await showSpecialtiesList(ctx, apiClient, page);
}

export async function handleSpecialtyDetail(
  ctx: Context,
  apiClient: APIClient,
  code: string,
  fromTest: boolean = false,
): Promise<void> {
  try {
    const specialty = await apiClient.getSpecialtyByCode(code);

    const textParts = [`<b>${specialty.name}</b>`, `<code>${specialty.code}</code>`, ''];

    if (specialty.short_description) {
      textParts.push(`<i>${specialty.short_description}</i>`, '');
    }

    if (specialty.description && specialty.description.length > 0) {
      textParts.push('<b>Описание:</b>');
      for (const desc of specialty.description) {
        textParts.push(`• ${desc}`, '');
      }
    }

    if (specialty.education_options && specialty.education_options.length > 0) {
      textParts.push('<b>Варианты обучения:</b>');
      for (const opt of specialty.education_options) {
        const places: string[] = [];
        if (opt.budget_places > 0) places.push(`бюджет: ${opt.budget_places}`);
        if (opt.paid_places > 0) places.push(`платное: ${opt.paid_places}`);
        const placesStr = places.length > 0 ? places.join(', ') : 'мест нет';
        const durationStr = opt.duration ? ` — ${opt.duration}` : '';
        textParts.push(`• ${opt.education_level}${durationStr} (${placesStr})`, '');
      }
    }

    if (specialty.exams && specialty.exams.length > 0) {
      textParts.push('<b>Экзамены:</b>');
      for (const exam of specialty.exams) {
        textParts.push(`• ${exam}`, '');
      }
    }

    const text = textParts.join('\n').trimEnd();
    const keyboard = specialtyDetailKeyboard(code, fromTest);

    if (specialty.images && specialty.images.length > 0) {
      const image = specialty.images[0];
      const caption = formatCaption(text, image.caption);
      await editMessageWithPhoto(ctx, image.url, caption, keyboard);
    } else {
      await safeEditMessage(ctx, text, keyboard);
    }
  } catch (err: any) {
    await answerCallback(ctx, { notification: `Ошибка: ${err.message}` });
  }
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

    const textParts = [`<b>${fact.title}</b>`, ''];
    if (fact.description) {
      for (const desc of fact.description) {
        textParts.push(`• ${desc}`, '');
      }
    }
    const text = textParts.join('\n').trimEnd();

    const totalImages = fact.images ? fact.images.length : 0;
    const keyboard = specialtyFactsKeyboard([], code, true);

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
