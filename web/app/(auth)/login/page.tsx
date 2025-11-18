import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';
import { authOptions } from '@/lib/auth';

export const metadata = {
  title: 'Login | Palompy',
};

export default async function LoginPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect('/subscription');
  }
  const errorParam = typeof searchParams?.error === 'string' ? searchParams?.error : undefined;
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 420, backgroundColor: '#fff', padding: '2.5rem', borderRadius: '1rem', boxShadow: '0 20px 50px rgba(15,23,42,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Palompy Console</h1>
        <p style={{ color: '#475569', marginTop: '0.25rem' }}>Войдите с рабочей почтой и кодом доступа.</p>
        <LoginForm initialError={errorParam} />
      </div>
    </div>
  );
}
