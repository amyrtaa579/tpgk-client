import { Context } from '@maxhub/max-bot-api';
import { APIClient } from '../services/apiClient';
import { safeEditMessage, formatCaption, editMessageWithPhoto } from '../utils/helpers';
import { backKeyboard } from '../keyboards/inline';

export async function handleAbout(ctx: Context, apiClient: APIClient): Promise<void> {
  try {
    const about = await apiClient.getAboutCollege();

    const textParts = [`<b>${about.title}</b>`, ''];
    for (const desc of about.description) {
      textParts.push(`• ${desc}`, '');
    }
    const text = textParts.join('\n').trimEnd();

    if (about.images && about.images.length > 0) {
      const image = about.images[0];
      const caption = formatCaption(text, image.caption);
      await editMessageWithPhoto(ctx, image.url, caption, backKeyboard('menu:home'));
    } else {
      await safeEditMessage(ctx, text, backKeyboard('menu:home'));
    }
  } catch (err: any) {
    const errorMsg = err.message ? `Ошибка при загрузке данных: ${err.message}` : 'Произошла ошибка при загрузке данных.';
    await safeEditMessage(ctx, errorMsg, backKeyboard('menu:home'));
  }
}
