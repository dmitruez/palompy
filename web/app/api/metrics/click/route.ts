import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recordClickMetric } from '@/lib/db/metrics';

interface ClickRequestBody {
  action?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }

  const body = ((await request.json().catch(() => ({}))) ?? {}) as ClickRequestBody;
  if (!body.action || typeof body.action !== 'string') {
    return NextResponse.json({ error: 'Поле action обязательно' }, { status: 400 });
  }

  const metadata = typeof body.metadata === 'object' && body.metadata ? body.metadata : {};
  const timestamp = typeof body.timestamp === 'string' ? body.timestamp : undefined;

  try {
    await recordClickMetric({
      userId: Number(session.user.id),
      action: body.action,
      metadata: {
        ...metadata,
        userId: Number(session.user.id),
        action: body.action,
        timestamp: timestamp ?? new Date().toISOString(),
      },
      occurredAt: timestamp,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('Failed to record click metric', error);
    return NextResponse.json({ error: 'Не удалось сохранить событие' }, { status: 500 });
  }
}
