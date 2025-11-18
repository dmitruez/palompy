import { query } from './client';

export interface SubscriptionRow {
  id: number;
  user_id: number;
  stripe_subscription_id: string;
  stripe_customer_id: string | null;
  stripe_price_id: string | null;
  stripe_checkout_session_id: string | null;
  status: string;
  current_period_end: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export async function getActiveSubscriptionForUser(userId: number): Promise<SubscriptionRow | null> {
  const result = await query<SubscriptionRow>(
    `SELECT * FROM subscriptions
     WHERE user_id = $1
       AND current_period_end > NOW()
       AND status IN ('active', 'trialing')
     ORDER BY current_period_end DESC
     LIMIT 1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

interface SaveArgs {
  userId: number;
  subscriptionId: string;
  customerId: string;
  priceId: string | null;
  checkoutSessionId: string;
  status: string;
  currentPeriodEnd: string;
  metadata?: Record<string, unknown>;
}

export async function saveSubscription(args: SaveArgs): Promise<SubscriptionRow> {
  const result = await query<SubscriptionRow>(
    `INSERT INTO subscriptions (
      user_id,
      stripe_subscription_id,
      stripe_customer_id,
      stripe_price_id,
      stripe_checkout_session_id,
      status,
      current_period_end,
      metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, '{}'::jsonb))
    ON CONFLICT (stripe_subscription_id) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      stripe_price_id = EXCLUDED.stripe_price_id,
      stripe_checkout_session_id = EXCLUDED.stripe_checkout_session_id,
      status = EXCLUDED.status,
      current_period_end = EXCLUDED.current_period_end,
      metadata = EXCLUDED.metadata,
      updated_at = NOW()
    RETURNING *`,
    [
      args.userId,
      args.subscriptionId,
      args.customerId,
      args.priceId,
      args.checkoutSessionId,
      args.status,
      args.currentPeriodEnd,
      args.metadata ?? {},
    ],
  );
  return result.rows[0];
}
