import { query } from '../db/postgres';
import { Subscription } from '../models/subscription';
import { HttpError } from '../http/errors';

export async function getSubscriptionById(id: number): Promise<Subscription | null> {
  const result = await query<Subscription>('SELECT * FROM subscriptions WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function requireActiveSubscription(subscriptionId: number, userId?: number): Promise<Subscription> {
  const subscription = await getSubscriptionById(subscriptionId);
  if (!subscription) {
    throw new HttpError(403, 'Подписка не найдена');
  }
  if (userId && subscription.user_id !== userId) {
    throw new HttpError(403, 'Подписка принадлежит другому пользователю');
  }
  const isActiveStatus = ['active', 'trialing'].includes(subscription.status);
  const notExpired = new Date(subscription.current_period_end).getTime() > Date.now();
  if (!isActiveStatus || !notExpired) {
    throw new HttpError(402, 'Подписка неактивна или истекла');
  }
  return subscription;
}
