import { Context } from '@maxhub/max-bot-api';
import { APIClient } from '../services/apiClient';
import { safeEditMessage, progressBar } from '../utils/helpers';
import { answerCallback, getUserId } from '../utils/contextHelpers';
import {
  testStartKeyboard,
  testQuestionKeyboard,
  testResultKeyboard,
  testResultsKeyboard,
} from '../keyboards/inline';
import type { TestQuestionModel } from '../models/test';

const MULTIPLE_CHOICE_QUESTION_NUMBERS = new Set([4, 8]);

function isMultipleChoice(question: TestQuestionModel, questionIndex: number): boolean {
  const questionNumber = questionIndex + 1;
  if (MULTIPLE_CHOICE_QUESTION_NUMBERS.has(questionNumber)) return true;
  if (question.multiple_choice) return true;
  return false;
}

interface TestState {
  questions: TestQuestionModel[];
  answers: Record<string, number | number[]>;
  currentQuestion: number;
  specialtyNames: Record<string, string>;
}

const testStates = new Map<string, TestState>();

function getUserStateKey(userId: number, chatId: number): string {
  return `test:${userId}:${chatId}`;
}

export async function handleTestMenu(ctx: Context): Promise<void> {
  const text =
    '<b>Профориентационный тест</b>\n\n' +
    'Этот тест поможет вам подобрать подходящую специальность на основе ваших предпочтений и интересов.\n\n' +
    'Тест состоит из нескольких вопросов. Просто выбирайте вариант ответа, который вам больше нравится.\n\n' +
    'В конце вы увидите список специальностей, которые могут вам подойти.';
  await safeEditMessage(ctx, text, testStartKeyboard());
}

export async function handleTestStart(ctx: Context, apiClient: APIClient): Promise<void> {
  try {
    const questions = await apiClient.getTestQuestions();

    if (!questions || questions.length === 0) {
      const text = 'Вопросы теста временно недоступны.';
      await safeEditMessage(ctx, text, testStartKeyboard());
      return;
    }

    let specialtyNames: Record<string, string> = {};
    try {
      const specResponse = await apiClient.getSpecialties({ page: 1, limit: 50 });
      for (const spec of specResponse.items) {
        specialtyNames[spec.code] = spec.name;
      }
    } catch (e) {
      console.warn('[TEST] Не удалось загрузить список специальностей:', e);
    }

    const userId = getUserId(ctx);
    const chatId = ctx.chatId || 0;
    const key = getUserStateKey(userId, chatId);
    testStates.set(key, {
      questions,
      answers: {},
      currentQuestion: 0,
      specialtyNames,
    });

    await showQuestion(ctx, key, 0);
  } catch (err: any) {
    await answerCallback(ctx, { notification: `Ошибка: ${err.message}` });
  }
}

async function showQuestion(
  ctx: Context,
  stateKey: string,
  questionIndex: number,
): Promise<void> {
  const state = testStates.get(stateKey);
  if (!state) {
    await safeEditMessage(ctx, 'Ошибка: данные теста не найдены', testStartKeyboard());
    return;
  }

  if (questionIndex >= state.questions.length) {
    await showTestResults(ctx, stateKey);
    return;
  }

  const question = state.questions[questionIndex];
  const total = state.questions.length;
  const current = questionIndex + 1;

  const progress = progressBar(current, total);
  let text = `${progress}\n\n<b>Вопрос ${current} из ${total}</b>\n\n${question.text}`;

  const answers = state.answers;
  const selected = answers[String(question.id)];
  const selectedIndices = Array.isArray(selected)
    ? selected
    : selected !== undefined
    ? [selected as number]
    : [];

  const multipleChoice = isMultipleChoice(question, questionIndex);
  const keyboard = testQuestionKeyboard(
    question.options,
    question.id,
    multipleChoice,
    selectedIndices,
    questionIndex > 0,
  );

  // Если есть изображение — загружаем и отправляем с ним
  if (question.image_url) {
    try {
      const imageAttachment = await ctx.api.uploadImage({ url: question.image_url });
      const attachments: any[] = [imageAttachment.toJson(), keyboard];

      await ctx.editMessage({
        text,
        attachments,
        format: 'html',
      } as any);
    } catch (err) {
      console.warn('[TEST] Не удалось загрузить изображение, отправляю текст:', err);
      await safeEditMessage(ctx, text, keyboard);
    }
  } else {
    await safeEditMessage(ctx, text, keyboard);
  }
}

export async function handleTestAnswer(
  ctx: Context,
  apiClient: APIClient,
  questionId: number,
  answerIndex: number,
): Promise<void> {
  const userId = getUserId(ctx);
  const chatId = ctx.chatId || 0;
  const stateKey = getUserStateKey(userId, chatId);
  const state = testStates.get(stateKey);

  if (!state) {
    await answerCallback(ctx, { notification: 'Ошибка: данные теста не найдены' });
    return;
  }

  const question = state.questions.find(q => q.id === questionId);
  if (!question) {
    await answerCallback(ctx, { notification: 'Вопрос не найден' });
    return;
  }

  const questionIndex = state.questions.findIndex(q => q.id === questionId);
  const multipleChoice = isMultipleChoice(question, questionIndex);

  if (multipleChoice) {
    let current = state.answers[String(questionId)];
    if (!Array.isArray(current)) {
      current = current !== undefined ? [current as number] : [];
    }

    const idx = (current as number[]).indexOf(answerIndex);
    if (idx >= 0) {
      (current as number[]).splice(idx, 1);
    } else {
      (current as number[]).push(answerIndex);
    }
    state.answers[String(questionId)] = current;

    const selected = state.answers[String(questionId)] as number[];
    const keyboard = testQuestionKeyboard(
      question.options,
      question.id,
      true,
      selected,
      questionIndex > 0,
    );

    const total = state.questions.length;
    const progress = progressBar(questionIndex + 1, total);
    const text = `${progress}\n\n<b>Вопрос ${questionIndex + 1} из ${total}</b>\n\n${question.text}`;

    // Сначала отвечаем на callback с новым сообщением
    try {
      if (question.image_url) {
        const imageAttachment = await ctx.api.uploadImage({ url: question.image_url });
        await answerCallback(ctx, {
          message: {
            text,
            attachments: [imageAttachment.toJson(), keyboard],
            format: 'html',
          } as any,
        });
      } else {
        await answerCallback(ctx, {
          message: {
            text,
            attachments: [keyboard],
            format: 'html',
          } as any,
        });
      }
    } catch (err) {
      console.error('[TEST] Ошибка при ответе на callback:', err);
      await answerCallback(ctx, { notification: 'Ошибка обновления' });
    }
  } else {
    state.answers[String(questionId)] = answerIndex;

    // Показываем следующий вопрос или результаты
    const nextIndex = questionIndex + 1;
    if (nextIndex >= state.questions.length) {
      await showTestResults(ctx, stateKey);
    } else {
      await showQuestion(ctx, stateKey, nextIndex);
    }

    await answerCallback(ctx, {});
  }
}

export async function handleTestNext(
  ctx: Context,
  apiClient: APIClient,
  questionId: number,
): Promise<void> {
  const userId = getUserId(ctx);
  const chatId = ctx.chatId || 0;
  const stateKey = getUserStateKey(userId, chatId);
  const state = testStates.get(stateKey);

  if (!state) {
    await answerCallback(ctx, { notification: 'Ошибка: данные теста не найдены' });
    return;
  }

  const selected = state.answers[String(questionId)];
  if (!selected || (Array.isArray(selected) && selected.length === 0)) {
    await answerCallback(ctx, { notification: 'Выберите хотя бы один вариант' });
    return;
  }

  const questionIndex = state.questions.findIndex(q => q.id === questionId);
  const nextIndex = questionIndex + 1;

  if (nextIndex >= state.questions.length) {
    await showTestResults(ctx, stateKey);
  } else {
    await showQuestion(ctx, stateKey, nextIndex);
  }

  await answerCallback(ctx, {});
}

export async function handleTestBack(
  ctx: Context,
  apiClient: APIClient,
  questionId: number,
): Promise<void> {
  const userId = getUserId(ctx);
  const chatId = ctx.chatId || 0;
  const stateKey = getUserStateKey(userId, chatId);
  const state = testStates.get(stateKey);

  if (!state) {
    await answerCallback(ctx, { notification: 'Ошибка: данные теста не найдены' });
    return;
  }

  const questionIndex = state.questions.findIndex(q => q.id === questionId);
  const prevIndex = questionIndex - 1;

  if (prevIndex < 0) {
    await answerCallback(ctx, { notification: 'Это первый вопрос' });
    return;
  }

  await showQuestion(ctx, stateKey, prevIndex);
  await answerCallback(ctx, {});
}

async function showTestResults(ctx: Context, stateKey: string): Promise<void> {
  const state = testStates.get(stateKey);
  if (!state) {
    await safeEditMessage(ctx, 'Данные теста утеряны. Пройдите тест заново.', testStartKeyboard());
    return;
  }

  const specialtyScores: Record<string, number> = {};

  for (const question of state.questions) {
    const answer = state.answers[String(question.id)];
    if (answer === undefined) continue;

    const answerIndices = Array.isArray(answer) ? answer : [answer as number];

    for (const answerIndex of answerIndices) {
      if (answerIndex >= question.answer_scores.length) continue;
      const answerScore = question.answer_scores[answerIndex];
      for (const specialty of answerScore.specialties) {
        specialtyScores[specialty] = (specialtyScores[specialty] || 0) + 1;
      }
    }
  }

  const sortedSpecialties = Object.entries(specialtyScores)
    .sort((a, b) => b[1] - a[1]);

  if (sortedSpecialties.length === 0) {
    const text =
      '<b>Результаты тестирования</b>\n\n' +
      'К сожалению, не удалось подобрать специальности на основе ваших ответов.\n' +
      'Попробуйте пройти тест ещё раз или выберите специальность вручную.';
    await safeEditMessage(ctx, text, testResultKeyboard());
    return;
  }

  const topSpecialties = sortedSpecialties.slice(0, 3);

  const textParts = ['<b>Результаты тестирования</b>', '', 'Вам могут подойти следующие специальности:', ''];
  const specialtiesForKeyboard: Array<{ code: string; score: number; name: string }> = [];

  for (let i = 0; i < topSpecialties.length; i++) {
    const [code, score] = topSpecialties[i];
    const name = state.specialtyNames[code] || '';
    if (name) {
      textParts.push(`${i + 1}. <b>${code}</b> — ${name} (совпадений: ${score})`);
    } else {
      textParts.push(`${i + 1}. <b>${code}</b> (совпадений: ${score})`);
    }
    specialtiesForKeyboard.push({ code, score, name });
  }

  const text = textParts.join('\n');
  const keyboard = testResultsKeyboard(specialtiesForKeyboard);
  await safeEditMessage(ctx, text, keyboard);
}

export async function handleTestResults(ctx: Context): Promise<void> {
  const userId = getUserId(ctx);
  const chatId = ctx.chatId || 0;
  const stateKey = getUserStateKey(userId, chatId);
  await showTestResults(ctx, stateKey);
}

export async function handleTestRestart(ctx: Context, apiClient: APIClient): Promise<void> {
  const userId = getUserId(ctx);
  const chatId = ctx.chatId || 0;
  const stateKey = getUserStateKey(userId, chatId);
  testStates.delete(stateKey);
  await handleTestStart(ctx, apiClient);
}
