const { Bot } = require('@maxhub/max-bot-api');
const { config } = require('./dist/config/settings');
const fs = require('fs');

const bot = new Bot(config.botToken);

async function getUsers() {
  console.log('🔍 Ищу всех пользователей бота...\n');

  let allChatIds = new Set();

  // Метод 1: Получаем список чатов
  try {
    console.log('📡 Метод 1: chats...');
    const chats = await bot.api.raw.get('chats', {
      query: { limit: 100, offset: 0 }
    });
    console.log('✅ Ответ:', JSON.stringify(chats, null, 2));
    
    if (chats?.chats && Array.isArray(chats.chats)) {
      for (const chat of chats.chats) {
        const id = chat.chat_id || chat.id;
        if (id) allChatIds.add(String(id));
      }
    }
  } catch (err) {
    console.log('❌ chats:', err.message);
  }

  // Метод 2: Получаем обновления (updates)
  try {
    console.log('\n📡 Метод 2: updates...');
    const updates = await bot.api.raw.get('updates', {
      query: { limit: 100 }
    });
    console.log('✅ Ответ:', JSON.stringify(updates, null, 2).substring(0, 1000));
    
    if (updates?.events && Array.isArray(updates.events)) {
      for (const event of updates.events) {
        const chatId = event.message?.chat?.chat_id || event.message?.sender?.user_id;
        if (chatId) allChatIds.add(String(chatId));
      }
    }
  } catch (err) {
    console.log('❌ updates:', err.message);
  }

  console.log(`\n📊 Итого найдено уникальных чатов: ${allChatIds.size}`);
  
  if (allChatIds.size > 0) {
    console.log('Chat IDs:', [...allChatIds].join(', '));
    fs.writeFileSync('known_chats.json', JSON.stringify([...allChatIds].map(Number), null, 2));
    console.log('💾 Сохранено в known_chats.json');
  } else {
    console.log('\n⚠️  Max API не предоставляет список пользователей напрямую.');
    console.log('💡 Используй сохранение через middleware (уже добавлено в main.ts).');
    console.log('   Каждый пользователь, который напишет боту, будет сохранён автоматически.');
  }
}

getUsers().catch(console.error);
