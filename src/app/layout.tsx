import type { Metadata, Viewport } from 'next';
import ToastProvider from '@/components/ToastProvider';
import FloatingKakao from '@/components/FloatingKakao';
import FloatingHome from '@/components/FloatingHome';
import FloatingPhone from '@/components/FloatingPhone';
import AuthProvider from '@/components/AuthProvider';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: '다사랑 간병 - 따뜻한 손길, 정성이 담긴 간병',
    template: '%s - 다사랑 간병',
  },
  description:
    '충북 제천·충주·영월 간병 서비스. 24시간 상주 간병, 식사·위생·활동보조, 투약 관리. 무료 상담으로 맞춤 견적을 받아보세요. 제천지역자활센터 소속 다사랑 간병공동체.',
  keywords: ['간병', '간병인', '제천간병', '충주간병', '영월간병', '24시간간병', '노인간병', '환자간병', '요양보호사', '다사랑간병'],
  authors: [{ name: '다사랑 간병공동체' }],
  creator: '다사랑 간병공동체',
  metadataBase: new URL('https://www.dasarangcare.co.kr'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://www.dasarangcare.co.kr',
    siteName: '다사랑 간병',
    title: '다사랑 간병 - 따뜻한 손길, 정성이 담긴 간병',
    description:
      '충북 제천·충주·영월 간병 서비스. 24시간 상주 간병, 무료 상담으로 맞춤 견적을 받아보세요.',
    images: [
      {
        url: '/hero-grandmother.jpg',
        width: 1200,
        height: 630,
        alt: '다사랑 간병 서비스',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '다사랑 간병 - 따뜻한 손길, 정성이 담긴 간병',
    description:
      '충북 제천·충주·영월 간병 서비스. 24시간 상주 간병, 무료 상담.',
    images: ['/hero-grandmother.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: { other: { 'naver-site-verification': '4fefec1c7f3e6bb643de0d9eeadb2f856e8406de' } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
          crossOrigin="anonymous"
        />
        <style>{`@media print {
          header, footer, nav, .no-print { display: none !important; }
          html, body { background: white !important; background-image: none !important; }
          @page { size: A4 portrait; margin: 5mm; }
        }`}</style>
      </head>
      <body style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <AuthProvider />
        <header className="no-print" style={{
          position: 'fixed',
          top: 0,
          right: 0,
          zIndex: 50,
          background: 'rgba(74,124,89,0.95)',
          backdropFilter: 'blur(8px)',
          color: 'white',
          padding: '0.5rem 1rem',
          fontSize: '0.9rem',
          fontWeight: 600,
          borderRadius: '0 0 0 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          🌿 제천 다사랑간병
        </header>
        <main style={{ flex: 1 }}>{children}</main>
        <ToastProvider />
        <FloatingHome />
        <FloatingPhone />
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
