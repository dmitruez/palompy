const defaultUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres',
  nextAuthSecret: process.env.NEXTAUTH_SECRET ?? 'dev-secret',
  nextAuthUrl: defaultUrl,
  loginAccessCode: process.env.LOGIN_ACCESS_CODE ?? '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripePriceId: process.env.STRIPE_PRICE_ID ?? '',
  stripeSuccessUrl: process.env.STRIPE_SUCCESS_URL ?? `${defaultUrl}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
  stripeCancelUrl: process.env.STRIPE_CANCEL_URL ?? `${defaultUrl}/subscription?status=cancelled`,
  apiJwtSecret: process.env.API_JWT_SECRET ?? 'change-me',
};
