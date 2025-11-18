import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMetricsSummary } from '@/lib/db/metrics';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }
  try {
    const summary = await getMetricsSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error('Failed to load metrics summary', error);
    return NextResponse.json({ error: 'Не удалось загрузить метрики' }, { status: 500 });
  }
}
