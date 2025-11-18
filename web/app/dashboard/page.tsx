import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import { authOptions } from '@/lib/auth';

export const metadata = {
  title: 'Dashboard | Palompy',
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <p style={{ margin: 0, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Аналитика</p>
        <h1 style={{ margin: '0.4rem 0 0', fontSize: '2.5rem' }}>Дашборд действий пользователей</h1>
        <p style={{ marginTop: '0.5rem', color: '#475569' }}>
          Сводка посещений, кликов и использования тарифов за последние недели.
        </p>
      </header>
      <DashboardClient />
    </div>
  );
}
