import NextAuth, { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { env } from './env';
import { ensureUser } from './db/users';
import { getActiveSubscriptionForUser } from './db/subscriptions';

function validateEmail(email: unknown): string | null {
  if (typeof email !== 'string') {
    return null;
  }
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes('@')) {
    return null;
  }
  return trimmed;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: env.nextAuthSecret,
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'Access Code',
      credentials: {
        email: { label: 'Email', type: 'email' },
        accessCode: { label: 'Access Code', type: 'password' },
        name: { label: 'Name', type: 'text' },
      },
      authorize: async (credentials) => {
        const email = validateEmail(credentials?.email);
        const accessCode = typeof credentials?.accessCode === 'string' ? credentials.accessCode.trim() : '';
        const displayName = typeof credentials?.name === 'string' ? credentials.name.trim() : undefined;
        if (!email) {
          return null;
        }
        if (env.loginAccessCode && accessCode !== env.loginAccessCode) {
          throw new Error('Неверный код доступа');
        }
        const user = await ensureUser(email, displayName);
        return {
          id: String(user.id),
          email: user.email,
          name: user.name ?? user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      if (token.id) {
        const userId = Number(token.id);
        try {
          const subscription = await getActiveSubscriptionForUser(userId);
          if (subscription) {
            token.subscription = {
              id: subscription.id,
              status: subscription.status,
              currentPeriodEnd: subscription.current_period_end,
            };
          } else {
            token.subscription = null;
          }
        } catch (error) {
          console.error('Не удалось загрузить подписку пользователя', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ? String(token.id) : undefined;
        session.user.subscription = token.subscription ?? null;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
