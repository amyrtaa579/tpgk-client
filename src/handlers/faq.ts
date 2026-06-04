import { Context } from '@maxhub/max-bot-api';
import { APIClient } from '../services/apiClient';
import { safeEditMessage, formatCaption, editMessageWithPhoto } from '../utils/helpers';
import { answerCallback } from '../utils/contextHelpers';
import {
  faqCategoriesKeyboard,
  faqListKeyboard,
  faqDetailKeyboard,
} from '../keyboards/inline';
import type { FAQModel } from '../models/faq';
import type { DocumentListItemModel } from '../models/document';
import * as path from 'path';

// Универсальная функция для получения URL документа
function getDocUrl(doc: any): string | undefined {
  return doc.url || doc.file_url;
}

function getDocName(doc: any): string {
  return doc.alt || doc.caption || doc.title || 'Документ';
}

function linkDocumentsToFaq(
  faqs: FAQModel[],
  allDocuments: DocumentListItemModel[],
): FAQModel[] {
  const docMap = new Map(allDocuments.map(d => [d.id, d]));
  for (const faq of faqs) {
    // Обрабатываем document_file_ids (документы из галереи)
    if (faq.document_file_ids) {
      for (const docId of faq.document_file_ids) {
        const doc = docMap.get(docId);
        if (doc && !faq.documents.find((d: any) => getDocUrl(d) === doc.file_url)) {
          faq.documents.push({
            title: doc.title,
            file_url: doc.file_url,
            file_size: doc.file_size,
          } as any);
        }
      }
    }
  }
  return faqs;
}

export async function handleFaqMenu(ctx: Context, apiClient: APIClient): Promise<void> {
  await showFaqCategories(ctx, apiClient);
}

async function showFaqCategories(ctx: Context, apiClient: APIClient): Promise<void> {
  try {
    console.log('📥 DEBUG: Вход в showFaqCategories');
    const faqs = await apiClient.getFaq();
    const documents = await apiClient.getDocumentsList();
    linkDocumentsToFaq(faqs, documents);

    const categories = [...new Set(faqs.filter(f => f.category).map(f => f.category))].sort();
    const keyboard = faqCategoriesKeyboard(categories);
    const text = '<b>Часто задаваемые вопросы</b>\n\nВыберите категорию:';
    
    console.log('📝 DEBUG: Обновляем сообщение (категорий: ' + categories.length + ')');
    await safeEditMessage(ctx, text, keyboard);
    console.log('✅ DEBUG: Сообщение обновлено');
  } catch (err: any) {
    console.error('❌ DEBUG: Ошибка в showFaqCategories:', err);
    await answerCallback(ctx, { notification: `Ошибка: ${err.message}` });
  }
}

export async function handleFaqCategory(
  ctx: Context,
  apiClient: APIClient,
  category: string,
  page: number = 1,
): Promise<void> {
  try {
    let faqs: FAQModel[];
    let categoryName: string;

    if (category === 'all') {
      faqs = await apiClient.getFaq();
      categoryName = 'Все вопросы';
    } else {
      faqs = await apiClient.getFaq(category);
      categoryName = category;
    }

    const documents = await apiClient.getDocumentsList();
    linkDocumentsToFaq(faqs, documents);

    if (faqs.length === 0) {
      const text = `<b>${categoryName}</b>\n\nВ этой категории вопросов пока нет.`;
      const keyboard = faqCategoriesKeyboard([]);
      await safeEditMessage(ctx, text, keyboard);
      return;
    }

    const itemsPerPage = 9;
    const totalPages = Math.ceil(faqs.length / itemsPerPage);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFaqs = faqs.slice(startIndex, endIndex);

    const textParts = [`<b>${categoryName}</b>`, ''];
    for (let i = 0; i < paginatedFaqs.length; i++) {
      const globalIndex = startIndex + i + 1;
      textParts.push(`${globalIndex} <b>${paginatedFaqs[i].question}</b>`);
    }
    textParts.push('\nВыберите вопрос:');
    const text = textParts.join('\n');

    const keyboard = faqListKeyboard(paginatedFaqs, category, currentPage, totalPages);
    await safeEditMessage(ctx, text, keyboard);
  } catch (err: any) {
    await answerCallback(ctx, { notification: `Ошибка: ${err.message}` });
  }
}

export async function handleFaqList(
  ctx: Context,
  apiClient: APIClient,
  page: number = 1,
): Promise<void> {
  try {
    const faqs = await apiClient.getFaq();
    const documents = await apiClient.getDocumentsList();
    linkDocumentsToFaq(faqs, documents);

    if (faqs.length === 0) {
      const text = '<b>Часто задаваемые вопросы</b>\n\nВопросы пока не добавлены.';
      const keyboard = faqCategoriesKeyboard([]);
      await safeEditMessage(ctx, text, keyboard);
      return;
    }

    const itemsPerPage = 9;
    const totalPages = Math.ceil(faqs.length / itemsPerPage);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFaqs = faqs.slice(startIndex, endIndex);

    const textParts = ['<b>Все вопросы</b>', ''];
    for (let i = 0; i < paginatedFaqs.length; i++) {
      const globalIndex = startIndex + i + 1;
      textParts.push(`${globalIndex} <b>${paginatedFaqs[i].question}</b>`);
    }
    textParts.push('\nВыберите вопрос:');
    const text = textParts.join('\n');

    const keyboard = faqListKeyboard(paginatedFaqs, null, currentPage, totalPages);
    await safeEditMessage(ctx, text, keyboard);
  } catch (err: any) {
    await answerCallback(ctx, { notification: `Ошибка: ${err.message}` });
  }
}

export async function handleFaqDetail(
  ctx: Context,
  apiClient: APIClient,
  faqId: number,
  category: string | null,
): Promise<void> {
  try {
    const faqs = await apiClient.getFaq();
    const documents = await apiClient.getDocumentsList();
    linkDocumentsToFaq(faqs, documents);
    const faq = faqs.find(f => f.id === faqId);

    if (!faq) {
      await answerCallback(ctx, { notification: 'Вопрос не найден' });
      return;
    }

    const textParts = [`<b>${faq.question}</b>`, ''];
    if (faq.answer) {
      const answers = Array.isArray(faq.answer) ? faq.answer : [faq.answer];
      for (const ans of answers) {
        textParts.push(`• ${ans}`, '');
      }
    }
    if (faq.category) {
      textParts.push(`<i>Категория: ${faq.category}</i>`);
    }
    const text = textParts.join('\n').trimEnd();

    const docs = faq.documents && faq.documents.length > 0 ? faq.documents : null;
    const keyboard = faqDetailKeyboard(category || faq.category, faq.id, docs);

    if (faq.images && faq.images.length > 0) {
      const image = faq.images[0];
      const caption = formatCaption(text, image.caption);
      await editMessageWithPhoto(ctx, image.url, caption, keyboard);
    } else {
      await safeEditMessage(ctx, text, keyboard);
    }
  } catch (err: any) {
    await answerCallback(ctx, { notification: `Ошибка: ${err.message}` });
  }
}

export async function handleFaqDoc(
  ctx: Context,
  apiClient: APIClient,
  faqId: number,
  docIndex: number,
): Promise<void> {
  try {
    const faqs = await apiClient.getFaq();
    const documents = await apiClient.getDocumentsList();
    linkDocumentsToFaq(faqs, documents);
    const faq = faqs.find(f => f.id === faqId);

    if (!faq) {
      await answerCallback(ctx, { notification: 'Вопрос не найден' });
      return;
    }

    if (!faq.documents || docIndex >= faq.documents.length) {
      await answerCallback(ctx, { notification: 'Документ не найден' });
      return;
    }

    const doc = faq.documents[docIndex] as any;
    const docUrl = getDocUrl(doc);
    const docName = getDocName(doc);

    if (!docUrl) {
      console.error('[FAQ DOC] URL документа не найден:', doc);
      await answerCallback(ctx, { notification: 'URL документа не найден' });
      return;
    }

    console.log(`[FAQ DOC] Загрузка: ${docUrl}, имя: ${docName}`);

    const fileExtension = path.extname(docUrl).toLowerCase() || '.pdf';
    let fileName = docName;
    if (!fileName.toLowerCase().endsWith(fileExtension)) {
      fileName = `${fileName}${fileExtension}`;
    }

    const response = await fetch(docUrl);
    if (!response.ok) {
      await answerCallback(ctx, { notification: `Ошибка скачивания: ${response.status}` });
      return;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const tmpPath = `/tmp/${Date.now()}_${fileName}`;
    require('fs').writeFileSync(tmpPath, buffer);

    const fileAttachment = await ctx.api.uploadFile({ source: tmpPath });
    await ctx.reply(`📄 ${fileName}`, {
      format: 'html',
      attachments: [fileAttachment.toJson()],
    });

    require('fs').unlinkSync(tmpPath);
    await answerCallback(ctx, {});
  } catch (err: any) {
    console.error(`[FAQ DOC] Ошибка: ${err.message}`);
    await answerCallback(ctx, { notification: 'Ошибка при загрузке документа' });
  }
}
