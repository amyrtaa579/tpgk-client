import { Context } from '@maxhub/max-bot-api';
import { APIClient } from '../services/apiClient';
import { safeEditMessage, formatCaption, editMessageWithPhoto, editMessageWithFile } from '../utils/helpers';
import { answerCallback } from '../utils/contextHelpers';
import {
  faqCategoriesKeyboard,
  faqListKeyboard,
  faqDetailKeyboard,
} from '../keyboards/inline';
import type { FAQModel } from '../models/faq';
import type { DocumentListItemModel } from '../models/document';
import * as path from 'path';

function linkDocumentsToFaq(
  faqs: FAQModel[],
  allDocuments: DocumentListItemModel[],
): FAQModel[] {
  const docMap = new Map(allDocuments.map(d => [d.id, d]));
  for (const faq of faqs) {
    if (faq.document_file_ids) {
      for (const docId of faq.document_file_ids) {
        const doc = docMap.get(docId);
        if (doc) {
          faq.documents.push({
            url: doc.file_url,
            alt: doc.title,
            caption: doc.title,
          });
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
    const faqs = await apiClient.getFaq();
    const documents = await apiClient.getDocumentsList();
    linkDocumentsToFaq(faqs, documents);

    const categories = [...new Set(faqs.filter(f => f.category).map(f => f.category))].sort();
    const keyboard = faqCategoriesKeyboard(categories);
    const text = '<b>Часто задаваемые вопросы</b>\n\nВыберите категорию:';
    await safeEditMessage(ctx, text, keyboard);
  } catch (err: any) {
    await answerCallback(ctx, { notification: `Ошибка: ${err.message}` });
  }
}

export async function handleFaqCategory(
  ctx: Context,
  apiClient: APIClient,
  category: string,
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

    const textParts = [`<b>${categoryName}</b>`, ''];
    for (let i = 0; i < faqs.length; i++) {
      textParts.push(`${i + 1} <b>${faqs[i].question}</b>`);
    }
    textParts.push('\nВыберите вопрос:');
    const text = textParts.join('\n');

    const keyboard = faqListKeyboard(faqs, category);
    await safeEditMessage(ctx, text, keyboard);
  } catch (err: any) {
    await answerCallback(ctx, { notification: `Ошибка: ${err.message}` });
  }
}

export async function handleFaqList(ctx: Context, apiClient: APIClient): Promise<void> {
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

    const textParts = ['<b>Все вопросы</b>', ''];
    for (let i = 0; i < faqs.length; i++) {
      textParts.push(`${i + 1} <b>${faqs[i].question}</b>`);
    }
    textParts.push('\nВыберите вопрос:');
    const text = textParts.join('\n');

    const keyboard = faqListKeyboard(faqs);
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
      for (const ans of faq.answer) {
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

    const doc = faq.documents[docIndex];
    const fileExtension = path.extname(doc.url).toLowerCase();
    let docName = doc.alt || doc.caption || `Документ ${docIndex + 1}`;
    if (!docName.toLowerCase().endsWith(fileExtension)) {
      docName = `${docName}${fileExtension}`;
    }

    const response = await fetch(doc.url);
    if (!response.ok) {
      await answerCallback(ctx, { notification: 'Ошибка при скачивании документа' });
      return;
    }

    // Скачиваем файл во временный файл
    const buffer = Buffer.from(await response.arrayBuffer());
    const tmpPath = `/tmp/${Date.now()}_${docName}`;
    require('fs').writeFileSync(tmpPath, buffer);

    // Отправляем файл как новое сообщение
    const fileAttachment = await ctx.api.uploadFile({ source: tmpPath });
    await ctx.reply(`📄 ${docName}`, {
      format: 'html',
      attachments: [fileAttachment.toJson()],
    });

    // Удаляем временный файл
    require('fs').unlinkSync(tmpPath);
    await answerCallback(ctx, {});
  } catch (err: any) {
    console.error(`[FAQ DOC] Ошибка: ${err.message}`);
    await answerCallback(ctx, { notification: 'Ошибка при загрузке документа' });
  }
}
