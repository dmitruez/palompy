import { env } from './env';

interface StripeLineItem {
  price: string;
  quantity: number;
}

export interface StripeCheckoutSession {
  id: string;
  url: string | null;
  customer: string | null;
  customer_email: string | null;
  payment_status: string;
  subscription: StripeSubscription | string | null;
}

export interface StripeSubscription {
  id: string;
  status: string;
  customer: string;
  current_period_end: number;
  items: {
    data: { price: { id: string | null } | null }[];
  };
}

function formEncode(data: Record<string, string>): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    params.append(key, value);
  });
  return params;
}

async function stripeFetch<T>(path: string, options: { method?: string; body?: URLSearchParams }): Promise<T> {
  if (!env.stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY не настроен');
  }
  const response = await fetch(`https://api.stripe.com${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${env.stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: options.body,
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message ?? 'Stripe API error');
  }
  return json as T;
}

export async function createCheckoutSession(args: {
  lineItems: StripeLineItem[];
  successUrl: string;
  cancelUrl: string;
  customerEmail: string;
  metadata: Record<string, string>;
}): Promise<StripeCheckoutSession> {
  const body: Record<string, string> = {
    mode: 'subscription',
    'success_url': args.successUrl,
    'cancel_url': args.cancelUrl,
    'customer_email': args.customerEmail,
  };
  args.lineItems.forEach((item, index) => {
    body[`line_items[${index}][price]`] = item.price;
    body[`line_items[${index}][quantity]`] = String(item.quantity);
  });
  Object.entries(args.metadata).forEach(([key, value]) => {
    body[`metadata[${key}]`] = value;
  });
  body['payment_method_types[0]'] = 'card';
  return stripeFetch('/v1/checkout/sessions', { method: 'POST', body: formEncode(body) });
}

export async function retrieveCheckoutSession(sessionId: string): Promise<StripeCheckoutSession> {
  const params = new URLSearchParams();
  params.append('expand[0]', 'subscription');
  return stripeFetch(`/v1/checkout/sessions/${sessionId}?${params.toString()}`, { method: 'GET' });
}
