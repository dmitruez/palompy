import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { retrieveCheckoutSession } from '@/lib/stripe';
import { saveSubscription } from '@/lib/db/subscriptions';
import { generateApiSessionToken } from '@/lib/tokens';

interface RequestBody {
  sessionId?: string;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as RequestBody;
  if (!body.sessionId) {
    return NextResponse.json({ error: 'sessionId обязателен' }, { status: 400 });
  }
  try {
    const checkoutSession = await retrieveCheckoutSession(body.sessionId);
    const subscription = checkoutSession.subscription;
    if (!subscription || typeof subscription === 'string') {
      throw new Error('Stripe вернул пустую подписку');
    }
    if (checkoutSession.customer_email !== session.user.email) {
      throw new Error('Сессия оплаты принадлежит другому пользователю');
    }
    if (checkoutSession.payment_status !== 'paid') {
      throw new Error('Платёж ещё не завершён');
    }
    const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
    const record = await saveSubscription({
      userId: Number(session.user.id),
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      priceId: subscription.items?.data?.[0]?.price?.id ?? null,
      checkoutSessionId: checkoutSession.id,
      status: subscription.status,
      currentPeriodEnd: periodEnd,
      metadata: { checkoutSession: checkoutSession.id },
    });
    const token = generateApiSessionToken({
      userId: Number(session.user.id),
      subscriptionId: record.id,
      expiresAt: record.current_period_end,
    });
    return NextResponse.json({
      subscription: {
        id: record.id,
        status: record.status,
        renewsAt: record.current_period_end,
        priceId: record.stripe_price_id,
      },
      token,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
