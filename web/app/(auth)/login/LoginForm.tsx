'use client';

import { FormEvent, useState, type CSSProperties } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  initialError?: string;
}

export default function LoginForm({ initialError }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    const result = await signIn('credentials', {
      redirect: false,
      email,
      accessCode,
      name,
      callbackUrl: '/subscription',
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.push('/subscription');
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <span style={{ fontWeight: 600 }}>Имя</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Анна Иванова"
          style={inputStyle}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <span style={{ fontWeight: 600 }}>Рабочая почта</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="team@shop.ru"
          required
          style={inputStyle}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <span style={{ fontWeight: 600 }}>Код доступа</span>
        <input
          type="password"
          value={accessCode}
          onChange={(event) => setAccessCode(event.target.value)}
          placeholder="Введите код из письма"
          required
          style={inputStyle}
        />
      </label>
      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: '0.5rem',
          padding: '0.9rem 1.2rem',
          borderRadius: '0.75rem',
          fontWeight: 600,
          fontSize: '1rem',
          border: 'none',
          color: '#fff',
          background: loading ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.2s ease',
        }}
      >
        {loading ? 'Подождите...' : 'Войти'}
      </button>
    </form>
  );
}

const inputStyle: CSSProperties = {
  padding: '0.9rem 1rem',
  borderRadius: '0.75rem',
  border: '1px solid #cbd5f5',
  fontSize: '1rem',
  outline: 'none',
};
