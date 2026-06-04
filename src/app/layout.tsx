import type { Metadata } from 'next';
import ToastProvider from '@/components/ToastProvider';
import FloatingKakao from '@/components/FloatingKakao';
import FloatingHome from '@/components/FloatingHome';

export const metadata: Metadata = {
  title: '다사랑 간병 - 따뜻한 손길, 정성이 담긴 간병',
  description: '다사랑 간병공동체 - 제천지역자활센터',
  verification: { other: { 'naver-site-verification': '4fefec1c7f3e6bb643de0d9eeadb2f856e8406de' } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #FEFBF6 0%, #FFF9EE 30%, #F5F0E8 100%)',
        backgroundAttachment: 'fixed',
      }}>
        <header style={{
          position: 'fixed',
          top: 0,
          right: 0,
          zIndex: 50,
          background: 'rgba(74,124,89,0.95)',
          backdropFilter: 'blur(8px)',
          color: 'white',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: 600,
          borderRadius: '0 0 0 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          🌿 제천 다사랑간병
        </header>
        <main style={{ flex: 1 }}>{children}</main>
        <ToastProvider />
        <FloatingHome />
        <FloatingKakao />

        <footer style={{ background: '#4A7C59', color: 'rgba(255,255,255,0.8)' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '3rem 1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
              <div>
                <h3 style={{ color: 'white', fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>🌿 다사랑 간병</h3>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6, opacity: 0.6 }}>
                  따뜻한 손길, 정성이 담긴 간병 서비스
                </p>
              </div>
              <div>
                <h4 style={{ color: 'white', fontWeight: 500, marginBottom: '0.75rem' }}>소속</h4>
                <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>제천지역자활센터</p>
                <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>다사랑 간병공동체</p>
                <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>사업자번호: 141-94-02083</p>
              </div>
              <div>
                <h4 style={{ color: 'white', fontWeight: 500, marginBottom: '0.75rem' }}>문의</h4>
                <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>
                  문의사항은 홈페이지 문의하기를 이용해주세요.
                </p>
              </div>
            </div>
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', fontSize: '0.875rem', opacity: 0.4 }}>
              © {new Date().getFullYear()} 다사랑 간병공동체. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
