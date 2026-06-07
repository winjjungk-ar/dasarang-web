'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const AUTH_KEY = 'erp_auth_v3';
const AUTH_TTL = 10 * 60 * 1000; // 10분

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 10분 세션 체크
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(AUTH_KEY);
      if (stored) {
        const { ts } = JSON.parse(stored);
        if (Date.now() - ts < AUTH_TTL) {
          setAuthenticated(true);
          return;
        }
      }
    } catch { /* ignore */ }
    setAuthenticated(false);
  }, []);

  const handleLogin = async () => {
    if (!password) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) {
        sessionStorage.setItem(AUTH_KEY, JSON.stringify({ ts: Date.now() }));
        setAuthenticated(true);
      } else {
        setError(data.error || '비밀번호가 틀렸습니다');
      }
    } catch {
      setError('서버 연결에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div style={{ maxWidth: '400px', margin: '6rem auto', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#4A7C59', marginBottom: '1rem' }}>🔐 관리자 인증</h2>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="비밀번호"
          autoComplete="current-password"
          style={{ width: '100%', padding: '0.75rem', border: '2px solid #4A7C59', borderRadius: '0.5rem', fontSize: '1rem', marginBottom: '0.75rem' }} />
        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', padding: '0.75rem', background: loading ? '#999' : '#4A7C59', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: loading ? 'default' : 'pointer' }}>
          {loading ? '확인 중...' : '확인'}
        </button>
        {error && <p style={{ color: 'red', marginTop: '0.75rem' }}>{error}</p>}
      </div>
    );
  }

  return (
    <>
      {children}
      <div className="no-print" style={{ maxWidth: '1200px', margin: '2rem auto 0', padding: '1rem 0', borderTop: '1px solid #E0E0E0' }}>
        <Link href="/erp" style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          padding: '0.5rem 1rem', background: '#2D5A3D', color: '#fff',
          borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.85rem',
          fontWeight: 600,
        }}>
          ← ERP 메인
        </Link>
      </div>
    </>
  );
}
