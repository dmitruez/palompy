import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { env } from '@/lib/env';
import { createCheckoutSession } from '@/lib/stripe';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }
  if (!env.stripePriceId) {
    return NextResponse.json({ error: 'STRIPE_PRICE_ID не настроен' }, { status: 500 });
  }
  try {
    const checkoutSession = await createCheckoutSession({
      lineItems: [{ price: env.stripePriceId, quantity: 1 }],
      successUrl: env.stripeSuccessUrl,
      cancelUrl: env.stripeCancelUrl,
      customerEmail: session.user.email,
      metadata: {
        userId: String(session.user.id),
      },
    });
    return NextResponse.json({ id: checkoutSession.id, url: checkoutSession.url });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
