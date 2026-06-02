import { Context } from '@maxhub/max-bot-api';
import { mainMenuKeyboard } from '../keyboards/inline';
import { safeEditMessage } from '../utils/helpers';

const MENU_TEXT =
  'Бот ТПГК — ваш помощник в выборе профессии!\n\n' +
  'Выберите интересующий вас раздел:';

export async function handleStart(ctx: Context): Promise<void> {
  await ctx.reply(MENU_TEXT, {
    format: 'html',
    attachments: [mainMenuKeyboard()],
  });
}

export async function handleHome(ctx: Context): Promise<void> {
  await safeEditMessage(ctx, MENU_TEXT, mainMenuKeyboard());
}

export async function handleHelp(ctx: Context): Promise<void> {
  const helpText =
    '<b>Помощь</b>\n\n' +
    'Этот бот поможет вам:\n\n' +
    '• Узнать о Томском промышленно-гуманитарном колледже\n' +
    '• Изучить доступные специальности и условия обучения\n' +
    '• Подать документы на поступление\n' +
    '• Получить ответы на частые вопросы\n' +
    '• Подобрать специальность с помощью профориентационного теста\n\n' +
    '<b>Как пользоваться:</b>\n\n' +
    'Нажмите на нужную кнопку в меню для перехода в раздел. ' +
    'В каждом разделе есть навигация — используйте кнопки «Назад» и «Главное меню».';

  await ctx.reply(helpText, { format: 'html' });
}
