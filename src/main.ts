import { Bot } from '@maxhub/max-bot-api';
import { config } from './config/settings';
import { APIClient } from './services/apiClient';

// Handlers
import { handleStart, handleHome, handleHelp } from './handlers/start';
import { handleAbout } from './handlers/about';
import {
  handleSpecialtiesMenu,
  handleSpecialtyPage,
  handleSpecialtyDetail,
  handleSpecialtyFacts as handleSpecFacts,
  handleFactDetail as handleFactDetail,
} from './handlers/specialties';
import {
  handleAdmissionMenu,
  handleAdmissionSubmission,
  handleAdmissionDates,
  handleAdmissionFaq,
  handleAdmissionFaqDetail,
  handleAdmissionFaqDoc,
  handleAdmissionSpecialties,
} from './handlers/admission';
import {
  handleFaqMenu,
  handleFaqCategory,
  handleFaqList,
  handleFaqDetail as handleFaqDetail,
  handleFaqDoc,
} from './handlers/faq';
import {
  handleSpecialtyFacts as handleFacts,
  handleFactImageNav,
} from './handlers/facts';
import {
  handleTestMenu,
  handleTestStart,
  handleTestAnswer,
  handleTestNext,
  handleTestBack,
  handleTestResults,
  handleTestRestart,
} from './handlers/test';

const apiClient = new APIClient();
const bot = new Bot(config.botToken);

// Команды
bot.api.setMyCommands([
  { name: 'start', description: 'Запустить бота и показать главное меню' },
  { name: 'help', description: 'Показать справку по использованию бота' },
]);

// ========== КОМАНДЫ ==========
bot.command('start', async (ctx) => {
  try {
    await handleStart(ctx);
  } catch (err) {
    console.error('Ошибка в handleStart:', err);
  }
});

bot.command('help', async (ctx) => {
  try {
    await handleHelp(ctx);
  } catch (err) {
    console.error('Ошибка в handleHelp:', err);
  }
});

// ========== BOT_STARTED (кнопка "Начать" при первом входе) ==========
bot.on('bot_started', async (ctx) => {
  try {
    await handleStart(ctx);
  } catch (err) {
    console.error('Ошибка в bot_started:', err);
  }
});

// ========== CALLBACK ACTIONS ==========

// Главное меню
bot.action('menu:home', async (ctx) => {
  try {
    await handleHome(ctx);
  } catch (err) {
    console.error('Ошибка в handleHome:', err);
  }
});

bot.action('menu:restart', async (ctx) => {
  try {
    await handleStart(ctx);
  } catch (err) {
    console.error('Ошибка в handleStart (restart):', err);
  }
});
bot.action('menu:about', async (ctx) => {
  try {
    await handleAbout(ctx, apiClient);
  } catch (err) {
    console.error('Ошибка в handleAbout:', err);
  }
});

bot.action('menu:specialties', async (ctx) => {
  try {
    await handleSpecialtiesMenu(ctx, apiClient);
  } catch (err) {
    console.error('Ошибка в handleSpecialtiesMenu:', err);
  }
});

bot.action('menu:admission', async (ctx) => {
  try {
    await handleAdmissionMenu(ctx, apiClient);
  } catch (err) {
    console.error('Ошибка в handleAdmissionMenu:', err);
  }
});

bot.action('menu:faq', async (ctx) => {
  try {
    await handleFaqMenu(ctx, apiClient);
  } catch (err) {
    console.error('Ошибка в handleFaqMenu:', err);
  }
});

bot.action('menu:test', async (ctx) => {
  try {
    await handleTestMenu(ctx);
  } catch (err) {
    console.error('Ошибка в handleTestMenu:', err);
  }
});

// Специальности — пагинация
bot.action(/^specialties:page:(\d+)$/, async (ctx) => {
  try {
    const page = parseInt(ctx.match![1], 10);
    await handleSpecialtyPage(ctx, apiClient, page);
  } catch (err) {
    console.error('Ошибка в handleSpecialtyPage:', err);
  }
});

// Специальности — детали
bot.action(/^specialty:detail:(.+)$/, async (ctx) => {
  try {
    const code = ctx.match![1];
    await handleSpecialtyDetail(ctx, apiClient, code, false);
  } catch (err) {
    console.error('Ошибка в handleSpecialtyDetail:', err);
  }
});

// Факты специальностей — список
bot.action(/^specialty:facts:(.+)$/, async (ctx) => {
  try {
    const code = ctx.match![1];
    await handleSpecFacts(ctx, apiClient, code);
  } catch (err) {
    console.error('Ошибка в handleSpecFacts:', err);
  }
});

// Факт — детали
bot.action(/^fact:detail:(\d+):(.+)$/, async (ctx) => {
  try {
    const factId = parseInt(ctx.match![1], 10);
    const code = ctx.match![2];
    await handleFactDetail(ctx, apiClient, factId, code);
  } catch (err) {
    console.error('Ошибка в handleFactDetail:', err);
  }
});

// Навигация по изображениям фактов
bot.action(/^fact:image:back:(\d+)$/, async (ctx) => {
  try {
    await handleFactImageNav(ctx, apiClient, 'back');
  } catch (err) {
    console.error('Ошибка в handleFactImageNav:', err);
  }
});

bot.action(/^fact:image:forward:(\d+)$/, async (ctx) => {
  try {
    await handleFactImageNav(ctx, apiClient, 'forward');
  } catch (err) {
    console.error('Ошибка в handleFactImageNav:', err);
  }
});

// Приёмная кампания
bot.action('admission:submission', async (ctx) => {
  try {
    await handleAdmissionSubmission(ctx, apiClient);
  } catch (err) {
    console.error('Ошибка в handleAdmissionSubmission:', err);
  }
});

bot.action('admission:dates', async (ctx) => {
  try {
    await handleAdmissionDates(ctx, apiClient);
  } catch (err) {
    console.error('Ошибка в handleAdmissionDates:', err);
  }
});

bot.action('admission:faq', async (ctx) => {
  try {
    await handleAdmissionFaq(ctx, apiClient);
  } catch (err) {
    console.error('Ошибка в handleAdmissionFaq:', err);
  }
});

bot.action('admission:specialties', async (ctx) => {
  try {
    await handleAdmissionSpecialties(ctx, apiClient);
  } catch (err) {
    console.error('Ошибка в handleAdmissionSpecialties:', err);
  }
});

bot.action(/^admission:faq_detail:(\d+)$/, async (ctx) => {
  try {
    const faqId = parseInt(ctx.match![1], 10);
    await handleAdmissionFaqDetail(ctx, apiClient, faqId);
  } catch (err) {
    console.error('Ошибка в handleAdmissionFaqDetail:', err);
  }
});

bot.action(/^admission:faq_doc:(\d+):(\d+)$/, async (ctx) => {
  try {
    const faqId = parseInt(ctx.match![1], 10);
    const docIndex = parseInt(ctx.match![2], 10);
    await handleAdmissionFaqDoc(ctx, apiClient, faqId, docIndex);
  } catch (err) {
    console.error('Ошибка в handleAdmissionFaqDoc:', err);
  }
});

// FAQ — категории
bot.action(/^faq:category:(.*)$/, async (ctx) => {
  try {
    const category = ctx.match![1] || 'all';
    await handleFaqCategory(ctx, apiClient, category);
  } catch (err) {
    console.error('Ошибка в handleFaqCategory:', err);
  }
});

bot.action('faq:categories', async (ctx) => {
  try {
    await handleFaqMenu(ctx, apiClient);
  } catch (err) {
    console.error('Ошибка в handleFaqMenu:', err);
  }
});

bot.action('faq:list', async (ctx) => {
  try {
    await handleFaqList(ctx, apiClient);
  } catch (err) {
    console.error('Ошибка в handleFaqList:', err);
  }
});

// FAQ — детали
bot.action(/^faq:detail:(\d+)(?::(.*))?$/, async (ctx) => {
  try {
    const faqId = parseInt(ctx.match![1], 10);
    const category = ctx.match![2] || null;
    await handleFaqDetail(ctx, apiClient, faqId, category);
  } catch (err) {
    console.error('Ошибка в handleFaqDetail:', err);
  }
});

bot.action(/^faq:doc:(\d+):(\d+)$/, async (ctx) => {
  try {
    const faqId = parseInt(ctx.match![1], 10);
    const docIndex = parseInt(ctx.match![2], 10);
    await handleFaqDoc(ctx, apiClient, faqId, docIndex);
  } catch (err) {
    console.error('Ошибка в handleFaqDoc:', err);
  }
});

// Тест
bot.action('test:start', async (ctx) => {
  try {
    await handleTestStart(ctx, apiClient);
  } catch (err) {
    console.error('Ошибка в handleTestStart:', err);
  }
});

bot.action('test:restart', async (ctx) => {
  try {
    await handleTestRestart(ctx, apiClient);
  } catch (err) {
    console.error('Ошибка в handleTestRestart:', err);
  }
});

bot.action('test:results', async (ctx) => {
  try {
    await handleTestResults(ctx);
  } catch (err) {
    console.error('Ошибка в handleTestResults:', err);
  }
});

bot.action(/^test:answer:(\d+):(\d+)$/, async (ctx) => {
  try {
    const questionId = parseInt(ctx.match![1], 10);
    const answerIndex = parseInt(ctx.match![2], 10);
    await handleTestAnswer(ctx, apiClient, questionId, answerIndex);
  } catch (err) {
    console.error('Ошибка в handleTestAnswer:', err);
  }
});

bot.action(/^test:next:(\d+)$/, async (ctx) => {
  try {
    const questionId = parseInt(ctx.match![1], 10);
    await handleTestNext(ctx, apiClient, questionId);
  } catch (err) {
    console.error('Ошибка в handleTestNext:', err);
  }
});

bot.action(/^test:back:(\d+)$/, async (ctx) => {
  try {
    const questionId = parseInt(ctx.match![1], 10);
    await handleTestBack(ctx, apiClient, questionId);
  } catch (err) {
    console.error('Ошибка в handleTestBack:', err);
  }
});

bot.action(/^test:specialty:(.+)$/, async (ctx) => {
  try {
    const code = ctx.match![1];
    await handleSpecialtyDetail(ctx, apiClient, code, true);
  } catch (err) {
    console.error('Ошибка в handleSpecialtyDetail (from test):', err);
  }
});

// ========== ТЕКСТОВЫЕ КНОПКИ (hears) ==========
// Главное меню — текстовые кнопки
bot.hears('🏫 О колледже', async (ctx) => {
  try {
    await handleAbout(ctx, apiClient);
  } catch (err) {
    console.error('Ошибка в handleAbout (hears):', err);
  }
});

bot.hears('🎓 Специальности', async (ctx) => {
  try {
    await handleSpecialtiesMenu(ctx, apiClient);
  } catch (err) {
    console.error('Ошибка в handleSpecialtiesMenu (hears):', err);
  }
});

bot.hears('📋 Приёмная кампания', async (ctx) => {
  try {
    await handleAdmissionMenu(ctx, apiClient);
  } catch (err) {
    console.error('Ошибка в handleAdmissionMenu (hears):', err);
  }
});

bot.hears('❓ Часто задаваемые вопросы', async (ctx) => {
  try {
    await handleFaqMenu(ctx, apiClient);
  } catch (err) {
    console.error('Ошибка в handleFaqMenu (hears):', err);
  }
});

bot.hears('🧪 Профориентационный тест', async (ctx) => {
  try {
    await handleTestMenu(ctx);
  } catch (err) {
    console.error('Ошибка в handleTestMenu (hears):', err);
  }
});

// Навигация — текстовые кнопки
bot.hears('🏠 Главное меню', async (ctx) => {
  try {
    await handleHome(ctx);
  } catch (err) {
    console.error('Ошибка в handleHome (hears):', err);
  }
});

bot.hears('🔄 Перезагрузить', async (ctx) => {
  try {
    await handleStart(ctx);
  } catch (err) {
    console.error('Ошибка в handleStart (hears restart):', err);
  }
});

bot.hears('🚀 Начать тест', async (ctx) => {
  try {
    await handleTestStart(ctx, apiClient);
  } catch (err) {
    console.error('Ошибка в handleTestStart (hears):', err);
  }
});

bot.hears('🔄 Пройти заново', async (ctx) => {
  try {
    await handleTestRestart(ctx, apiClient);
  } catch (err) {
    console.error('Ошибка в handleTestRestart (hears):', err);
  }
});

bot.hears('📊 Результаты', async (ctx) => {
  try {
    await handleTestResults(ctx);
  } catch (err) {
    console.error('Ошибка в handleTestResults (hears):', err);
  }
});

// ========== ОБРАБОТКА ОШИБОК ==========
bot.catch((err) => {
  console.error('❌ Ошибка бота:', err);
});

// Логирование всех входящих сообщений (для отладки)
bot.on('message_created', async (ctx) => {
  try {
    console.log('📨 Получено сообщение:', ctx.message?.body?.text || '(без текста)');
  } catch (err) {
    console.error('Ошибка в message_created:', err);
  }
});

console.log('✅ Бот инициализирован, запускаю...');

// ========== ЗАПУСК ==========
console.log('🤖 Бот ТПГК запускается...');
bot.start({
  allowedUpdates: [
    'message_created',
    'message_callback',
    'bot_started',
  ],
});
