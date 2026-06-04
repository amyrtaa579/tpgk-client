import { Context } from '@maxhub/max-bot-api';
import { APIClient } from '../services/apiClient';
import { safeEditMessage, editMessageWithFile, editMessageWithPhoto } from '../utils/helpers';
import { answerCallback } from '../utils/contextHelpers';
import {
  admissionMenuKeyboard,
  admissionBackKeyboard,
  admissionFaqListKeyboard,
  admissionFaqDetailKeyboard,
} from '../keyboards/inline';
import type { FAQModel } from '../models/faq';
import type { DocumentModel } from '../models/specialty';
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

export async function handleAdmissionMenu(ctx: Context, apiClient: APIClient): Promise<void> {
  const text = '<b>Приёмная кампания</b>\n\nВыберите раздел:';
  await safeEditMessage(ctx, text, admissionMenuKeyboard());
}

export async function handleAdmissionSubmission(ctx: Context, apiClient: APIClient): Promise<void> {
  try {
    const admission = await apiClient.getAdmissionCampaign();

    const textParts = ['<b>Способы подачи документов</b>', ''];
    for (const method of admission.submission_methods) {
      textParts.push(`<b>${method.title}</b>`);
      textParts.push(method.description);
      if (method.link) {
        textParts.push(`🔗 ${method.link}`);
      }
      textParts.push('');
    }
    const text = textParts.join('\n').trimEnd();
    await safeEditMessage(ctx, text, admissionBackKeyboard());
  } catch (err: any) {
    await answerCallback(ctx, { notification: `Ошибка: ${err.message}` });
  }
}

export async function handleAdmissionDates(ctx: Context, apiClient: APIClient): Promise<void> {
  try {
    const admission = await apiClient.getAdmissionCampaign();

    if (!admission.important_dates || admission.important_dates.length === 0) {
      const text = '<b>Важные даты</b>\n\nИнформация о датах пока не добавлена.';
      await safeEditMessage(ctx, text, admissionBackKeyboard());
      return;
    }

    const textParts = ['<b>Важные даты</b>', ''];
    for (const dateItem of admission.important_dates) {
      const dateStr = new Date(dateItem.date).toLocaleDateString('ru-RU');
      textParts.push(`<b>${dateItem.title}</b>`);
      textParts.push(`🗓 ${dateStr}`);
      if (dateItem.description) {
        textParts.push(dateItem.description);
      }
      textParts.push('');
    }
    const text = textParts.join('\n').trimEnd();
    await safeEditMessage(ctx, text, admissionBackKeyboard());
  } catch (err: any) {
    await answerCallback(ctx, { notification: `Ошибка: ${err.message}` });
  }
}

export async function handleAdmissionFaq(
  ctx: Context,
  apiClient: APIClient,
  page: number = 1,
): Promise<void> {
  try {
    const faqs = await apiClient.getFaq();
    const documents = await apiClient.getDocumentsList();
    const admissionFaqs = faqs.filter(f => f.show_in_admission);
    linkDocumentsToFaq(admissionFaqs, documents);

    if (admissionFaqs.length === 0) {
      const text = '<b>Вопросы для поступающих</b>\n\nВопросы для приёмной кампании пока не добавлены.';
      await safeEditMessage(ctx, text, admissionBackKeyboard());
      return;
    }

    const itemsPerPage = 9;
    const totalPages = Math.ceil(admissionFaqs.length / itemsPerPage);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFaqs = admissionFaqs.slice(startIndex, endIndex);

    const textParts = ['<b>Вопросы для поступающих</b>', ''];
    const faqIds: number[] = [];
    for (let i = 0; i < paginatedFaqs.length; i++) {
      const globalIndex = startIndex + i + 1;
      textParts.push(`${globalIndex}. <b>${paginatedFaqs[i].question}</b>`, '');
      faqIds.push(paginatedFaqs[i].id);
    }
    textParts.push('Выберите номер:');
    const text = textParts.join('\n').trimEnd();

    const keyboard = admissionFaqListKeyboard(faqIds, currentPage, totalPages);
    await safeEditMessage(ctx, text, keyboard);
  } catch (err: any) {
    await answerCallback(ctx, { notification: `Ошибка: ${err.message}` });
  }
}

export async function handleAdmissionFaqDetail(
  ctx: Context,
  apiClient: APIClient,
  faqId: number,
): Promise<void> {
  try {
    const faqs = await apiClient.getFaq();
    const documents = await apiClient.getDocumentsList();
    const admissionFaqs = faqs.filter(f => f.show_in_admission);
    linkDocumentsToFaq(admissionFaqs, documents);
    const faq = admissionFaqs.find(f => f.id === faqId);

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
    const text = textParts.join('\n').trimEnd();

    const keyboard = admissionFaqDetailKeyboard(faq.id, faq.documents.length > 0 ? faq.documents : null);

    if (faq.images && faq.images.length > 0) {
      const image = faq.images[0];
      const caption = `${text}\n\n<i>${image.caption || ''}</i>`;
      const truncated = caption.length > 1024 ? caption.slice(0, 1021) + '...' : caption;
      await editMessageWithPhoto(ctx, image.url, truncated, keyboard);
    } else {
      await safeEditMessage(ctx, text, keyboard);
    }
  } catch (err: any) {
    await answerCallback(ctx, { notification: `Ошибка: ${err.message}` });
  }
}

export async function handleAdmissionFaqDoc(
  ctx: Context,
  apiClient: APIClient,
  faqId: number,
  docIndex: number,
): Promise<void> {
  try {
    const faqs = await apiClient.getFaq();
    const documents = await apiClient.getDocumentsList();
    const admissionFaqs = faqs.filter(f => f.show_in_admission);
    linkDocumentsToFaq(admissionFaqs, documents);
    const faq = admissionFaqs.find(f => f.id === faqId);

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
    console.error(`[ADMISSION FAQ DOC] Ошибка: ${err.message}`);
    await answerCallback(ctx, { notification: 'Ошибка при загрузке документа' });
  }
}

export async function handleAdmissionSpecialties(ctx: Context, apiClient: APIClient): Promise<void> {
  try {
    const admission = await apiClient.getAdmissionCampaign();

    if (!admission.specialties_admission || admission.specialties_admission.length === 0) {
      const text = '<b>Специальности</b>\n\nСпециальности пока не добавлены.';
      await safeEditMessage(ctx, text, admissionBackKeyboard());
      return;
    }

    const textParts = ['<b>Специальности</b>', ''];
    for (const spec of admission.specialties_admission) {
      textParts.push(`<b>${spec.code} — ${spec.name}</b>`);
      const places: string[] = [];
      if (spec.budget_places > 0) places.push(`бюджет: ${spec.budget_places}`);
      if (spec.paid_places > 0) places.push(`платное: ${spec.paid_places}`);
      const placesStr = places.length > 0 ? places.join(', ') : 'мест нет';
      textParts.push(`Места: ${placesStr}`);
      if (spec.duration) textParts.push(`Срок обучения: ${spec.duration}`);
      if (spec.exams && spec.exams.length > 0) textParts.push(`Экзамены: ${spec.exams.join(', ')}`);
      textParts.push('');
    }
    const text = textParts.join('\n').trimEnd();
    await safeEditMessage(ctx, text, admissionBackKeyboard());
  } catch (err: any) {
    await answerCallback(ctx, { notification: `Ошибка: ${err.message}` });
  }
}
