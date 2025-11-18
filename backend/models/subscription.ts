export interface Subscription {
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
