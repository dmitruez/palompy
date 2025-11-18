import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getActiveSubscriptionForUser } from '@/lib/db/subscriptions';
import SubscriptionManager from './SubscriptionManager';

interface PageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export const metadata = {
  title: 'Subscription | Palompy',
};

export default async function SubscriptionPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }
  const activeSubscription = await getActiveSubscriptionForUser(Number(session.user.id));
  const normalizedSubscription = activeSubscription
    ? {
        id: activeSubscription.id,
        status: activeSubscription.status,
        renewsAt: activeSubscription.current_period_end,
        priceId: activeSubscription.stripe_price_id,
      }
    : null;

  const sessionId = typeof searchParams?.session_id === 'string' ? searchParams.session_id : undefined;
  const statusParam = typeof searchParams?.status === 'string' ? searchParams.status : undefined;

  return (
    <SubscriptionManager
      userEmail={session.user.email ?? ''}
      subscription={normalizedSubscription}
      initialSessionId={sessionId}
      checkoutStatus={statusParam}
    />
  );
}
