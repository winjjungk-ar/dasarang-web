'use client';

import { useState } from 'react';

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
      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: A4; margin: 8mm; }
        @media print {
          nav, footer, .no-print { display: none !important; }
          body { padding-top: 0 !important; margin: 0 !important; background: white !important; }
        }
      `}} />
    </>
  );
}
