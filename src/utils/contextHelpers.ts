import { Context } from '@maxhub/max-bot-api';

/**
 * Ответить на callback-кнопку с уведомлением.
 */
export async function answerCallback(
  ctx: Context,
  options?: { notification?: string; message?: any },
): Promise<void> {
  const callbackId = ctx.callback?.callback_id;
  if (!callbackId) return;
  await ctx.answerOnCallback({
    callback_id: callbackId,
    notification: options?.notification || '',
    message: options?.message || null,
  } as any);
}

/**
 * Получить ID пользователя из контекста.
 */
export function getUserId(ctx: Context): number {
  if (ctx.callback?.user) {
    return (ctx.callback.user as any).user_id || 0;
  }
  if (ctx.user) {
    return (ctx.user as any).user_id || 0;
  }
  return 0;
}
