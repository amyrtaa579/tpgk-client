import { Bot } from '@maxhub/max-bot-api';
import { config } from './src/config/settings';
import { mainMenuKeyboard } from './src/keyboards/inline';
import * as fs from 'fs';
import * as path from 'path';

const bot = new Bot(config.botToken);
const CHATS_FILE = path.join(__dirname, 'known_chats.json');

async function broadcast() {
  if (!fs.existsSync(CHATS_FILE)) {
    console.log('❌ Файл known_chats.json не найден.');
    console.log('💡 Сначала запусти бота — он сохраняет chat_id при каждом сообщении.');
    return;
  }

  const chatIds: number[] = JSON.parse(fs.readFileSync(CHATS_FILE, 'utf-8'));
  console.log(`\n👥 Найдено ${chatIds.length} пользователей\n`);

  if (chatIds.length === 0) {
    console.log('⚠️  Список пуст. Подожди, пока пользователи напишут боту.');
    return;
  }

  let success = 0, failed = 0;

  for (const chatId of chatIds) {
    try {
      await bot.api.sendMessageToChat(
        chatId,
        '<b>🔄 Бот обновлён!</b>\n\n' +
        'Все данные актуальны. Можно пользоваться! 👇',
        {
          format: 'html',
          attachments: [mainMenuKeyboard()],
        } as any,
      );
      console.log(`  ✅ ${chatId}`);
      success++;
    } catch (err: any) {
      console.log(`  ❌ ${chatId}: ${err.message}`);
      failed++;
    }
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n📊 Итого: ✅ ${success}, ❌ ${failed}`);
}

broadcast().catch(console.error);
