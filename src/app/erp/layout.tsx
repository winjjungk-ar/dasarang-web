'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const AUTH_KEY = 'erp_auth_v3';
const AUTH_TTL = 10 * 60 * 1000; // 10분

export default function ERPLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
        <h2 style={{ color: '#1B3A2D', marginBottom: '1rem' }}>🔐 ERP 관리자 인증</h2>
        <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '1.5rem' }}>ERP 시스템은 관리자만 접근할 수 있습니다</p>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="비밀번호"
          autoComplete="current-password"
          style={{ width: '100%', padding: '0.75rem', border: '2px solid #2D5A3D', borderRadius: '0.5rem', fontSize: '1rem', marginBottom: '0.75rem', boxSizing: 'border-box' }} />
        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', padding: '0.75rem', background: loading ? '#999' : '#2D5A3D', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 'bold', cursor: loading ? 'default' : 'pointer' }}>
          {loading ? '확인 중...' : '확인'}
        </button>
        {error && <p style={{ color: 'red', marginTop: '0.75rem' }}>{error}</p>}
      </div>
    );
  }

  const sections = [
    {
      label: '📋 출퇴근',
      items: [
        { href: '/erp/attendance', label: '출퇴근 관리' },
        { href: '/checkin', label: '체크인 (QR)' },
      ],
    },
    {
      label: '📊 리포트',
      items: [
        { href: '/erp/report', label: '병원별 매출' },
        { href: '/erp/payroll', label: '💰 급여 정산' },
      ],
    },
    {
      label: '📄 서류 발급',
      items: [
        { href: '/documents/employment-cert', label: '재직증명서' },
        { href: '/documents/care-log', label: '간병일지' },
        { href: '/documents/confirmation', label: '사용 확인서' },
        { href: '/documents/biz-reg', label: '사업자등록증' },
        { href: '/documents/transaction-cert', label: '거래 명세서' },
      ],
    },
    {
      label: '📮 보험 제출',
      items: [
        { href: '/erp/insurance', label: '서류 패키지 제출' },
      ],
    },
    {
      label: '⚙️ 관리',
      items: [
        { href: '/erp/accounting', label: '💳 입출금 관리' },
        { href: '/documents/caregivers', label: '간병인·병원·환자 등록' },
        { href: '/documents', label: '서류 발급 홈' },
      ],
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      {/* 상단 바 */}
      <div className="no-print" style={{
        display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem',
        padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #1B3A2D, #2D5A3D)',
        borderRadius: '1rem', color: 'white', flexWrap: 'wrap',
      }}>
        <Link href="/erp" style={{ fontSize: '1.4rem', fontWeight: 800, textDecoration: 'none', color: '#C8E6C9' }}>
          📊 다사랑 ERP
        </Link>
        <div style={{ flex: 1 }} />
        <Link href="/" style={{ textDecoration: 'none', color: '#A5D6A7', fontSize: '0.85rem' }}>🏠 홈페이지</Link>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* 사이드 네비 */}
        <div className="no-print" style={{ width: '220px', flexShrink: 0 }}>
          {sections.map(section => (
            <div key={section.label} style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05rem' }}>
                {section.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {section.items.map(item => (
                  <Link key={item.href} href={item.href} style={{
                    padding: '0.5rem 0.75rem', borderRadius: '0.5rem', textDecoration: 'none',
                    fontSize: '0.875rem',
                    background: pathname === item.href ? '#E8F0E8' : 'transparent',
                    color: pathname === item.href ? '#2D5A3D' : '#555',
                    fontWeight: pathname === item.href ? 700 : 400,
                  }}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 메인 콘텐츠 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {children}
          {pathname !== '/erp' && (
            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #E0E0E0' }}>
              <Link href="/erp" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.5rem 1rem', background: '#2D5A3D', color: '#fff',
                borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.85rem',
                fontWeight: 600,
              }}>
                ← ERP 메인
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
