import Link from 'next/link';

export default function DocumentsPage() {
  return (
    <div style={{ maxWidth: '600px', margin: '3rem auto', padding: '1rem' }}>
      <h2 style={{
        textAlign: 'center', color: '#4A7C59', fontSize: '1.75rem',
        marginBottom: '0.5rem'
      }}>
        📄 서류 발급
      </h2>
      <p style={{
        textAlign: 'center', color: '#6B7280', fontSize: '1.125rem',
        marginBottom: '2.5rem'
      }}>
        필요한 서류를 선택하세요
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {documents.map((doc) => (
          <Link
            key={doc.href}
            href={doc.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              padding: '1.75rem 1.5rem',
              borderRadius: '1.25rem',
              background: doc.bg,
              border: `2px solid ${doc.border}`,
              textDecoration: 'none',
              color: '#3D3929',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              minHeight: '100px',
              transition: 'background 0.2s',
            }}
          >
            {/* Icon */}
            <div style={{
              fontSize: '3rem',
              width: '5rem',
              height: '5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'white',
              borderRadius: '1rem',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              {doc.icon}
            </div>

            {/* Text */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#4A7C59',
                marginBottom: '0.25rem',
              }}>
                {doc.title}
              </div>
              <div style={{
                fontSize: '1rem',
                color: '#6B7280',
                lineHeight: 1.5,
              }}>
                {doc.desc}
              </div>
            </div>

            {/* Arrow */}
            <div style={{
              fontSize: '2rem',
              color: '#4A7C59',
              flexShrink: 0,
            }}>
              ›
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom note */}
      <div style={{
        marginTop: '2.5rem', padding: '1.25rem',
        background: '#FFF9EE', borderRadius: '0.75rem',
        border: '1px solid #F0E8D0', textAlign: 'center',
        fontSize: '0.9375rem', color: '#6B7280', lineHeight: 1.6,
      }}>
        💡 <strong>인쇄 팁:</strong> 각 서류 페이지에서 <strong>🖨️ 인쇄하기</strong> 버튼을 누르면<br />
        PDF로 저장하거나 프린터로 출력할 수 있습니다.
      </div>
    </div>
  );
}

const documents = [
  {
    href: '/documents/care-log',
    icon: '📋',
    title: '간병일지',
    desc: '날짜별 간병 기록을 작성하고 출력합니다',
    bg: 'linear-gradient(135deg, #F0F7F0, #E8F5E9)',
    border: '#C8E0C8',
  },
  {
    href: '/documents/confirmation',
    icon: '✅',
    title: '간병인 사용 확인서',
    desc: '보험사 제출용 확인서를 작성합니다',
    bg: 'linear-gradient(135deg, #FFF8F0, #FFF3E0)',
    border: '#F0D8B0',
  },
  {
    href: '/documents/employment-cert',
    icon: '📜',
    title: '재직증명서',
    desc: '간병인 재직증명서를 발급합니다',
    bg: 'linear-gradient(135deg, #F5F0FF, #EDE7F6)',
    border: '#D0C8E0',
  },
  {
    href: '/documents/biz-reg',
    icon: '🏢',
    title: '사업자등록증',
    desc: '사업자등록증 사본을 출력합니다',
    bg: 'linear-gradient(135deg, #F0F5FA, #E3F2FD)',
    border: '#C0D8F0',
  },
];
