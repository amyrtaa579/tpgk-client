import { Context } from '@maxhub/max-bot-api';
import { APIClient } from '../services/apiClient';
import { safeEditMessage, formatCaption, editMessageWithPhoto } from '../utils/helpers';
import { backKeyboard } from '../keyboards/inline';

export async function handleAbout(ctx: Context, apiClient: APIClient): Promise<void> {
  try {
    console.log('🔍 Запрашиваю данные о колледже...');
    const about = await apiClient.getAboutCollege();
    console.log('✅ Получены данные:', JSON.stringify(about, null, 2));

    const textParts = [`<b>${about.title}</b>`, ''];
    for (const desc of about.description) {
      textParts.push(`• ${desc}`, '');
    }
    const text = textParts.join('\n').trimEnd();
    console.log('📝 Сформирован текст:', text.substring(0, 100) + '...');

    if (about.images && about.images.length > 0) {
      const image = about.images[0];
      console.log('🖼️ Найдено изображение:', image.url);
      const caption = formatCaption(text, image.caption);
      console.log('📤 Отправляю фото с подписью...');
      await editMessageWithPhoto(ctx, image.url, caption, backKeyboard('menu:home'));
      console.log('✅ Сообщение отправлено');
    } else {
      console.log('⚠️ Изображений нет, отправляю только текст');
      await safeEditMessage(ctx, text, backKeyboard('menu:home'));
    }
  } catch (err: any) {
    console.error('❌ Ошибка в handleAbout:', err);
    const errorMsg = err.message ? `Ошибка при загрузке данных: ${err.message}` : 'Произошла ошибка при загрузке данных.';
    await safeEditMessage(ctx, errorMsg, backKeyboard('menu:home'));
  }
}
