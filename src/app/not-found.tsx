import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #FEFBF6 0%, #FFF9EE 50%, #F5F0E8 100%)',
      }}
    >
      <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🌿</div>
      <h1
        style={{
          fontSize: 'clamp(2rem, 6vw, 4rem)',
          fontWeight: 'bold',
          color: '#4A7C59',
          marginBottom: '0.5rem',
        }}
      >
        404
      </h1>
      <p
        style={{
          fontSize: '1.125rem',
          color: '#6B7280',
          marginBottom: '2rem',
          lineHeight: 1.7,
        }}
      >
        찾으시는 페이지가 없거나 이동되었습니다.
        <br />
        아래 링크를 통해 원하시는 정보를 찾아보세요.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            background: '#5B8C5A',
            color: 'white',
            padding: '0.875rem 2rem',
            borderRadius: '0.75rem',
            fontWeight: 'bold',
            textDecoration: 'none',
            fontSize: '1rem',
          }}
        >
          🏠 홈으로
        </Link>
        <Link
          href="/services"
          style={{
            display: 'inline-block',
            background: 'white',
            color: '#5B8C5A',
            padding: '0.875rem 2rem',
            borderRadius: '0.75rem',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: '1rem',
            border: '1.5px solid #D4E6D4',
          }}
        >
          🍽️ 간병 서비스
        </Link>
        <Link
          href="/inquiry"
          style={{
            display: 'inline-block',
            background: 'white',
            color: '#5B8C5A',
            padding: '0.875rem 2rem',
            borderRadius: '0.75rem',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: '1rem',
            border: '1.5px solid #D4E6D4',
          }}
        >
          💚 문의하기
        </Link>
      </div>

      <p style={{ marginTop: '3rem', color: '#9CA3AF', fontSize: '0.875rem' }}>
        📞 전화 상담: 상단의 전화 버튼을 이용해주세요
      </p>
    </div>
  )
}
