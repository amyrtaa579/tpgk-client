/**
 * Получение списка всех пользователей бота через raw API Max.
 * Запуск: npx ts-node get_users.ts
 */
import { Bot } from '@maxhub/max-bot-api';
import { config } from './src/config/settings';

const bot = new Bot(config.botToken);

async function getUsers() {
  console.log('🔍 Ищу всех пользователей бота...\n');

  const methods = [
    { name: 'bots/me', fn: () => bot.api.raw.get('bots/me', {}) },
    { name: 'chats', fn: () => bot.api.raw.get('chats', {}) },
    { name: 'subscriptions', fn: () => bot.api.raw.get('subscriptions', {}) },
    { name: 'users', fn: () => bot.api.raw.get('users', {}) },
    { name: 'bots/me/subscribers', fn: () => bot.api.raw.get('bots/me/subscribers', {}) },
    { name: 'bots/me/chats', fn: () => bot.api.raw.get('bots/me/chats', {}) },
  ];

  let allUsers: any[] = [];
  let botId: string | null = null;

  for (const m of methods) {
    try {
      const result = await m.fn();
      console.log(`✅ ${m.name}:`);
      console.log(JSON.stringify(result, null, 2).substring(0, 500));
      console.log('');
      
      // Извлекаем bot_id
      if (m.name === 'bots/me' && result?.bot_id) {
        botId = result.bot_id;
      }
      
      // Извлекаем пользователей
      if (Array.isArray(result)) {
        allUsers.push(...result);
      } else if (result?.items && Array.isArray(result.items)) {
        allUsers.push(...result.items);
      } else if (result?.users && Array.isArray(result.users)) {
        allUsers.push(...result.users);
      } else if (result?.subscribers && Array.isArray(result.subscribers)) {
        allUsers.push(...result.subscribers);
      } else if (result?.chats && Array.isArray(result.chats)) {
        allUsers.push(...result.chats);
      }
    } catch (err: any) {
      console.log(`❌ ${m.name}: ${err.message}\n`);
    }
  }

  // Если получили bot_id — пробуем ещё методы с ним
  if (botId) {
    const extraMethods = [
      { name: `bots/${botId}/subscribers`, fn: () => bot.api.raw.get(`bots/${botId}/subscribers`, {}) },
      { name: `bots/${botId}/chats`, fn: () => bot.api.raw.get(`bots/${botId}/chats`, {}) },
    ];
    for (const m of extraMethods) {
      try {
        const result = await m.fn();
        console.log(`✅ ${m.name}:`);
        console.log(JSON.stringify(result, null, 2).substring(0, 500));
        console.log('');
        if (Array.isArray(result)) allUsers.push(...result);
        else if (result?.items) allUsers.push(...result.items);
      } catch (err: any) {
        console.log(`❌ ${m.name}: ${err.message}\n`);
      }
    }
  }

  // Извлекаем уникальные user_id / chat_id
  const userIds = new Set<string>();
  for (const u of allUsers) {
    const id = u.user_id || u.chat_id || u.id || u.uuid || u.user?.user_id;
    if (id) userIds.add(String(id));
  }

  console.log(`\n📊 Итого найдено уникальных пользователей: ${userIds.size}`);
  if (userIds.size > 0) {
    console.log('ID:', [...userIds].join(', '));
    
    // Сохраняем в файл
    const fs = require('fs');
    fs.writeFileSync('known_chats.json', JSON.stringify([...userIds].map(Number), null, 2));
    console.log('💾 Сохранено в known_chats.json');
  }
}

getUsers().catch(console.error);
