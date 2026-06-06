'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (password === '448282') { setAuthenticated(true); setError(''); }
    else { setError('비밀번호가 틀렸습니다'); }
  };

  if (!authenticated) {
    return (
      <div style={{ maxWidth: '400px', margin: '6rem auto', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#4A7C59', marginBottom: '1rem' }}>🔐 관리자 인증</h2>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="비밀번호"
          style={{ width: '100%', padding: '0.75rem', border: '2px solid #4A7C59', borderRadius: '0.5rem', fontSize: '1rem', marginBottom: '0.75rem' }} />
        <button onClick={handleLogin} style={{ width: '100%', padding: '0.75rem', background: '#4A7C59', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}>확인</button>
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
      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: A4 portrait; margin: 0; }
        @media print {
          html, body {
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          body { padding: 0 !important; overflow: hidden !important; }
          nav, footer, header, .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}} />
    </>
  );
}
