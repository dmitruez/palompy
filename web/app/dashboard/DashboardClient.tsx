'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import type { MetricsSummary } from '@/types/metrics';

interface State {
  loading: boolean;
  error: string | null;
  summary: MetricsSummary | null;
}

export default function DashboardClient() {
  const [{ loading, error, summary }, setState] = useState<State>({ loading: true, error: null, summary: null });

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));
    fetch('/api/metrics/summary', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error ?? 'Не удалось загрузить данные');
        }
        return (response.json() as Promise<MetricsSummary>);
      })
      .then((payload) => {
        setState({ loading: false, error: null, summary: payload });
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          return;
        }
        setState({ loading: false, error: (err as Error).message, summary: null });
      });
    return () => controller.abort();
  }, []);

  const visitorData = useMemo(() => summary?.visitorsByDay ?? [], [summary]);
  const clickData = useMemo(() => summary?.clickFrequency ?? [], [summary]);

  if (loading) {
    return <div style={cardStyle}>Загружаем метрики...</div>;
  }

  if (error) {
    return (
      <div style={cardStyle}>
        <p style={{ margin: 0, fontWeight: 600 }}>Ошибка загрузки</p>
        <p style={{ marginTop: '0.5rem', color: '#dc2626' }}>{error}</p>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard title="Всего запросов" value={formatNumber(summary.totals.requests)} />
        <StatCard title="Среднее время ответа" value={`${summary.totals.avgResponseMs} мс`} />
        <StatCard title="Кликов" value={formatNumber(summary.totals.clicks)} />
      </section>

      <section style={cardStyle}>
        <header style={sectionHeaderStyle}>
          <div>
            <p style={sectionEyebrowStyle}>Посетители</p>
            <h3 style={sectionTitleStyle}>Активность за 2 недели</h3>
          </div>
        </header>
        {visitorData.length ? (
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visitorData} margin={{ top: 10, left: 0, right: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState message="Пока нет данных о посетителях" />
        )}
      </section>

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div style={{ ...cardStyle, flex: '1 1 320px' }}>
          <header style={sectionHeaderStyle}>
            <div>
              <p style={sectionEyebrowStyle}>Клики</p>
              <h3 style={sectionTitleStyle}>Популярные действия</h3>
            </div>
          </header>
          {clickData.length ? (
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clickData} layout="vertical" margin={{ top: 10, left: 0, right: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis type="category" dataKey="action" width={140} stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: 12 }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="Клики ещё не фиксировались" />
          )}
        </div>

        <div style={{ ...cardStyle, flex: '1 1 320px' }}>
          <header style={sectionHeaderStyle}>
            <div>
              <p style={sectionEyebrowStyle}>Планы</p>
              <h3 style={sectionTitleStyle}>Лимиты использования</h3>
            </div>
          </header>
          {summary.planUsage.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {summary.planUsage.map((plan) => {
                const percent = Math.min(100, Math.round((plan.used / plan.limit) * 100));
                return (
                  <div key={plan.plan}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>{plan.label}</span>
                      <span>
                        {plan.used}/{plan.limit}
                      </span>
                    </div>
                    <div style={progressTrackStyle}>
                      <div style={{ ...progressFillStyle, width: `${percent}%` }} />
                    </div>
                    <p style={{ marginTop: '0.3rem', color: '#475569', fontSize: '0.85rem' }}>
                      Запросов: {formatNumber(plan.requestCount)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="Данных по планам нет" />
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={cardStyle}>
      <p style={sectionEyebrowStyle}>{title}</p>
      <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 160,
      backgroundColor: '#f8fafc',
      borderRadius: '1rem',
      color: '#94a3b8',
      fontSize: '0.95rem',
    }}>
      {message}
    </div>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value);
}

const cardStyle: CSSProperties = {
  backgroundColor: '#fff',
  padding: '1.5rem',
  borderRadius: '1.25rem',
  boxShadow: '0 25px 45px rgba(15,23,42,0.08)',
};

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '1rem',
};

const sectionEyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.85rem',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
};

const progressTrackStyle: CSSProperties = {
  width: '100%',
  height: '0.55rem',
  borderRadius: '999px',
  backgroundColor: '#e2e8f0',
  marginTop: '0.4rem',
};

const progressFillStyle: CSSProperties = {
  height: '100%',
  borderRadius: '999px',
  background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
};
