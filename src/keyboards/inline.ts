import { Keyboard } from '@maxhub/max-bot-api';
import type { InlineKeyboardAttachmentRequest } from '@maxhub/max-bot-api/types';
const button = Keyboard.button;
import { DocumentModel } from '../models/specialty';
import { SpecialtyModel } from '../models/specialty';

const NUMBERED_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export function mainMenuKeyboard(): InlineKeyboardAttachmentRequest {
  return Keyboard.inlineKeyboard([
    [button.callback('🏫 О колледже', 'menu:about')],
    [button.callback('🎓 Специальности', 'menu:specialties')],
    [button.callback('📋 Приёмная кампания', 'menu:admission')],
    [button.callback('❓ Часто задаваемые вопросы', 'menu:faq')],
    [button.callback('🧪 Профориентационный тест', 'menu:test')],
    [button.callback('🔄 Перезагрузить', 'menu:restart')],
  ]);
}

export function backKeyboard(callbackData: string = 'menu:home'): InlineKeyboardAttachmentRequest {
  return Keyboard.inlineKeyboard([
    [button.callback('⬅️ Назад', callbackData)],
  ]);
}

export function specialtiesListKeyboard(
  specialties: SpecialtyModel[],
  page: number,
  totalPages: number,
): InlineKeyboardAttachmentRequest {
  const builder: any[][] = [];

  const rowSize = 4;
  for (let i = 0; i < specialties.length; i += rowSize) {
    const row = [];
    for (let j = 0; j < rowSize && i + j < specialties.length; j++) {
      const idx = i + j;
      const emoji = NUMBERED_EMOJIS[idx] ?? String(idx + 1);
      row.push(button.callback(emoji, `specialty:detail:${specialties[idx].code}`));
    }
    builder.push(row);
  }

  const navRow: any[] = [];
  if (page > 1) {
    navRow.push(button.callback('⬅️', `specialties:page:${page - 1}`));
  }
  if (page < totalPages) {
    navRow.push(button.callback('➡️', `specialties:page:${page + 1}`));
  }
  if (navRow.length > 0) {
    builder.push(navRow);
  }

  builder.push([button.callback('🏠 Главное меню', 'menu:home')]);

  return Keyboard.inlineKeyboard(builder);
}

export function specialtyDetailKeyboard(
  code: string | null = null,
  fromTest: boolean = false,
): InlineKeyboardAttachmentRequest {
  const builder: any[][] = [];

  if (code) {
    builder.push([button.callback('💡 Интересные факты', `specialty:facts:${code}`)]);
  }

  if (fromTest) {
    builder.push([button.callback('📊 Результаты', 'test:results')]);
    builder.push([button.callback('🏠 Главное меню', 'menu:home')]);
  } else {
    builder.push([button.callback('⬅️ К списку специальностей', 'menu:specialties')]);
    builder.push([button.callback('🏠 Главное меню', 'menu:home')]);
  }

  return Keyboard.inlineKeyboard(builder);
}

export function specialtyFactsKeyboard(
  facts: { id: number; title: string }[],
  code: string,
  backToList: boolean = false,
): InlineKeyboardAttachmentRequest {
  const builder: any[][] = [];

  const rowSize = 5;
  for (let i = 0; i < facts.length; i += rowSize) {
    const row = [];
    for (let j = 0; j < rowSize && i + j < facts.length; j++) {
      const idx = i + j;
      const emoji = NUMBERED_EMOJIS[idx] ?? String(idx + 1);
      row.push(button.callback(emoji, `fact:detail:${facts[idx].id}:${code}`));
    }
    builder.push(row);
  }

  const backCallback = backToList
    ? `specialty:facts:${code}`
    : `specialty:detail:${code}`;
  builder.push([button.callback('⬅️ Назад', backCallback)]);

  return Keyboard.inlineKeyboard(builder);
}

export function admissionMenuKeyboard(): InlineKeyboardAttachmentRequest {
  return Keyboard.inlineKeyboard([
    [button.callback('📤 Способы подачи документов', 'admission:submission')],
    [button.callback('📅 Важные даты', 'admission:dates')],
    [button.callback('❓ Вопросы для поступающих', 'admission:faq')],
    [button.callback('🎓 Специальности', 'admission:specialties')],
    [button.callback('🏠 Главное меню', 'menu:home')],
  ]);
}

export function admissionBackKeyboard(): InlineKeyboardAttachmentRequest {
  return Keyboard.inlineKeyboard([
    [button.callback('⬅️ Назад', 'menu:admission')],
  ]);
}

export function admissionFaqListKeyboard(
  faqIds: number[],
): InlineKeyboardAttachmentRequest {
  const builder: any[][] = [];
  const rowSize = 3;

  for (let i = 0; i < faqIds.length; i += rowSize) {
    const row = [];
    for (let j = 0; j < rowSize && i + j < faqIds.length; j++) {
      const idx = i + j;
      const emoji = NUMBERED_EMOJIS[idx] ?? String(idx + 1);
      row.push(button.callback(emoji, `admission:faq_detail:${faqIds[idx]}`));
    }
    builder.push(row);
  }

  builder.push([button.callback('⬅️ Назад', 'menu:admission')]);

  return Keyboard.inlineKeyboard(builder);
}

export function admissionFaqDetailKeyboard(
  faqId: number,
  documents: DocumentModel[] | null = null,
): InlineKeyboardAttachmentRequest {
  const builder: any[][] = [];

  if (documents) {
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const docName = (doc.alt || doc.caption || `Документ ${i + 1}`).slice(0, 30);
      builder.push([button.callback(`📄 ${docName}`, `admission:faq_doc:${faqId}:${i}`)]);
    }
  }

  builder.push([button.callback('⬅️ К списку вопросов', 'admission:faq')]);

  return Keyboard.inlineKeyboard(builder);
}

export function faqCategoriesKeyboard(
  categories: string[],
): InlineKeyboardAttachmentRequest {
  const builder: any[][] = [];

  builder.push([button.callback('📋 Все вопросы', 'faq:category:all')]);

  for (const category of categories) {
    builder.push([button.callback(category, `faq:category:${category}`)]);
  }

  builder.push([button.callback('🏠 Главное меню', 'menu:home')]);

  return Keyboard.inlineKeyboard(builder);
}

export function faqListKeyboard(
  faqs: { id: number; question: string }[],
  category: string | null = null,
): InlineKeyboardAttachmentRequest {
  const builder: any[][] = [];
  const rowSize = 3;

  for (let i = 0; i < faqs.length; i += rowSize) {
    const row = [];
    for (let j = 0; j < rowSize && i + j < faqs.length; j++) {
      const idx = i + j;
      const emoji = NUMBERED_EMOJIS[idx] ?? String(idx + 1);
      const faq = faqs[idx];
      let callback = `faq:detail:${faq.id}`;
      if (category) callback += `:${category}`;
      row.push(button.callback(emoji, callback));
    }
    builder.push(row);
  }

  // Кнопка назад ведёт к списку категорий
  builder.push([button.callback('⬅️ К категориям', 'faq:categories')]);

  return Keyboard.inlineKeyboard(builder);
}

export function faqDetailKeyboard(
  category: string | null = null,
  faqId: number,
  documents: DocumentModel[] | null = null,
): InlineKeyboardAttachmentRequest {
  const builder: any[][] = [];

  if (documents) {
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const docName = (doc.alt || doc.caption || `Документ ${i + 1}`).slice(0, 30);
      builder.push([button.callback(`📄 ${docName}`, `faq:doc:${faqId}:${i}`)]);
    }
  }

  const backCallback = category && category !== 'all'
    ? `faq:category:${category}`
    : 'faq:category:all';
  builder.push([button.callback('⬅️ Назад', backCallback)]);

  return Keyboard.inlineKeyboard(builder);
}

export function testStartKeyboard(): InlineKeyboardAttachmentRequest {
  return Keyboard.inlineKeyboard([
    [button.callback('🚀 Начать тест', 'test:start')],
    [button.callback('🏠 Главное меню', 'menu:home')],
  ]);
}

export function testQuestionKeyboard(
  options: string[],
  questionId: number,
  multipleChoice: boolean = false,
  selectedIndices: number[] = [],
  showBack: boolean = false,
): InlineKeyboardAttachmentRequest {
  const builder: any[][] = [];

  for (let i = 0; i < options.length; i++) {
    let text = options[i];
    if (multipleChoice) {
      const checkbox = selectedIndices.includes(i) ? '✅' : '⬜';
      text = `${checkbox} ${text}`;
    }
    builder.push([button.callback(text, `test:answer:${questionId}:${i}`)]);
  }

  if (multipleChoice) {
    const navRow: any[] = [];
    if (showBack) {
      navRow.push(button.callback('⬅️ Назад', `test:back:${questionId}`));
    }
    navRow.push(button.callback('➡️ Далее', `test:next:${questionId}`));
    if (navRow.length > 0) {
      builder.push(navRow);
    }
  } else if (showBack) {
    builder.push([button.callback('⬅️ Назад', `test:back:${questionId}`)]);
  }

  return Keyboard.inlineKeyboard(builder);
}

export function testResultKeyboard(): InlineKeyboardAttachmentRequest {
  return Keyboard.inlineKeyboard([
    [button.callback('🔄 Пройти заново', 'test:restart')],
    [button.callback('🏠 Главное меню', 'menu:home')],
  ]);
}

export function testResultsKeyboard(
  specialties: Array<{ code: string; score: number; name: string }>,
): InlineKeyboardAttachmentRequest {
  const builder: any[][] = [];

  const emojis = ['1️⃣', '2️⃣', '3️⃣'];
  // Все 3 кнопки в одной строке
  const row = specialties.slice(0, 3).map((spec, i) => {
    const emoji = emojis[i] ?? String(i + 1);
    return button.callback(emoji, `test:specialty:${spec.code}`);
  });
  if (row.length > 0) {
    builder.push(row);
  }

  builder.push([button.callback('🔄 Пройти заново', 'test:restart')]);
  builder.push([button.callback('🏠 Главное меню', 'menu:home')]);

  return Keyboard.inlineKeyboard(builder);
}
