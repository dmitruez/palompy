'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';

interface SubscriptionSummary {
  id: number;
  status: string;
  renewsAt: string;
  priceId: string | null;
}

interface Props {
  userId: number;
  userEmail: string;
  subscription: SubscriptionSummary | null;
  initialSessionId?: string;
  checkoutStatus?: string;
}

interface CompleteResponse {
  subscription: SubscriptionSummary;
  token: string;
}

export default function SubscriptionManager({
  userId,
  userEmail,
  subscription,
  initialSessionId,
  checkoutStatus,
}: Props) {
  const router = useRouter();
  const [activeSubscription, setActiveSubscription] = useState(subscription);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialSessionId) {
      return;
    }
    const finalize = async () => {
      setPending(true);
      setMessage('Подтверждаем платёж...');
      setError(null);
      try {
        const response = await fetch('/api/subscription/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: initialSessionId }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error ?? 'Не удалось подтвердить подписку');
        }
        const payload = (await response.json()) as CompleteResponse;
        setActiveSubscription(payload.subscription);
        setApiToken(payload.token);
        setMessage('Подписка активирована. Токен готов.');
        router.replace('/subscription');
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setPending(false);
      }
    };
    finalize();
  }, [initialSessionId, router]);

  useEffect(() => {
    if (checkoutStatus === 'cancelled') {
      setMessage('Оформление подписки отменено.');
    }
  }, [checkoutStatus]);

  const renewLabel = useMemo(() => {
    if (!activeSubscription) {
      return null;
    }
    try {
      const date = new Date(activeSubscription.renewsAt);
      return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      return activeSubscription.renewsAt;
    }
  }, [activeSubscription]);

  const trackClick = async (action: string, metadata: Record<string, unknown> = {}) => {
    if (!Number.isFinite(userId)) {
      return;
    }
    try {
      await fetch('/api/metrics/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          metadata: {
            userId,
            timestamp: new Date().toISOString(),
            ...metadata,
          },
        }),
      });
    } catch (trackingError) {
      console.warn('Не удалось записать метрику клика', trackingError);
    }
  };

  const startCheckout = async () => {
    setPending(true);
    setError(null);
    setMessage('Перенаправляем на Stripe...');
    void trackClick('subscription_checkout_clicked', {
      hasActiveSubscription: Boolean(activeSubscription),
      subscriptionId: activeSubscription?.id ?? null,
    });
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Не удалось создать сессию оплаты');
      }
      const payload = (await response.json()) as { url?: string };
      if (!payload.url) {
        throw new Error('Stripe вернул пустой URL');
      }
      window.location.href = payload.url;
    } catch (err) {
      setPending(false);
      setMessage(null);
      setError((err as Error).message);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '3rem 1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      <section style={cardStyle}>
        <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.4rem' }}>Аккаунт</p>
        <h2 style={{ margin: 0 }}>{userEmail}</h2>
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Статус подписки</p>
          {activeSubscription ? (
            <div style={{ marginTop: '0.5rem' }}>
              <span style={badgeStyle}>Активна</span>
              <p style={{ marginTop: '0.75rem', color: '#475569' }}>
                Обновится {renewLabel ?? '—'}
              </p>
              {activeSubscription.priceId && (
                <p style={{ marginTop: '0.25rem', color: '#475569' }}>Тариф: {activeSubscription.priceId}</p>
              )}
            </div>
          ) : (
            <p style={{ marginTop: '0.5rem', color: '#475569' }}>У вас нет активной подписки</p>
          )}
        </div>
        <button
          type="button"
          onClick={startCheckout}
          disabled={pending}
          style={{
            marginTop: '2rem',
            padding: '0.95rem 1.2rem',
            borderRadius: '0.85rem',
            border: 'none',
            background: pending ? '#94a3b8' : 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            color: '#fff',
            fontWeight: 600,
            cursor: pending ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
          }}
        >
          {activeSubscription ? 'Продлить подписку' : 'Оформить подписку'}
        </button>
      </section>

      <section style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Что включено</h3>
        <ul style={{ paddingLeft: '1.2rem', lineHeight: 1.7, color: '#475569' }}>
          <li>Проксирование API-ключа OpenAI на ваших условиях</li>
          <li>Неограниченные запросы на период подписки</li>
          <li>JWT-токен для бэкенда и виджетов</li>
          <li>Отдельный закрытый канал поддержки</li>
        </ul>
        {message && (
          <div style={infoStyle}>{message}</div>
        )}
        {error && (
          <div style={errorStyle}>{error}</div>
        )}
        {apiToken && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.35rem' }}>API токен</p>
            <code style={codeStyle}>{apiToken}</code>
            <p style={{ color: '#475569', marginTop: '0.35rem', fontSize: '0.85rem' }}>
              Сохраните токен в безопасном месте. Он понадобится для вызовов защищённого прокси.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

const cardStyle: CSSProperties = {
  flex: '1 1 300px',
  backgroundColor: '#fff',
  padding: '2rem',
  borderRadius: '1.25rem',
  boxShadow: '0 30px 50px rgba(15,23,42,0.08)',
};

const badgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.2rem 0.8rem',
  borderRadius: '999px',
  backgroundColor: '#dcfce7',
  color: '#15803d',
  fontWeight: 600,
  fontSize: '0.85rem',
};

const infoStyle: CSSProperties = {
  marginTop: '1rem',
  padding: '0.85rem 1rem',
  backgroundColor: '#ecfeff',
  borderRadius: '0.75rem',
  color: '#0369a1',
  fontSize: '0.9rem',
};

const errorStyle: CSSProperties = {
  marginTop: '1rem',
  padding: '0.85rem 1rem',
  backgroundColor: '#fee2e2',
  borderRadius: '0.75rem',
  color: '#b91c1c',
  fontSize: '0.9rem',
};

const codeStyle: CSSProperties = {
  display: 'block',
  padding: '0.85rem 1rem',
  borderRadius: '0.75rem',
  backgroundColor: '#0f172a',
  color: '#f1f5f9',
  wordBreak: 'break-all',
};
