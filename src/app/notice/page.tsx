import Link from 'next/link';

const notices = [
  {
    id: 1,
    title: '[안내] 다사랑 간병 서비스 지역 확대',
    date: '2026-05-15',
    important: true,
    content: '기존 충주시·제천시에서 영월군까지 서비스 지역이 확대되었습니다. 영월 지역 고객님들도 이제 편리하게 이용하실 수 있습니다.',
  },
  {
    id: 2,
    title: '[공지] 2026년 하계 간병인 추가 모집',
    date: '2026-05-10',
    important: false,
    content: '2026년 여름 시즌을 맞아 검증된 간병인을 추가 모집합니다. 더욱 빠른 매칭이 가능해집니다.',
  },
  {
    id: 3,
    title: '[안내] 보호자 앱 베타 서비스 시작',
    date: '2026-04-28',
    important: true,
    content: '실시간 간병 보고서와 GPS 위치 확인이 가능한 보호자 전용 앱 베타 서비스를 시작합니다. 관심 있으신 분은 문의하기를 통해 신청해주세요.',
  },
  {
    id: 4,
    title: '[공지] 설 연휴 간병 서비스 정상 운영',
    date: '2026-01-20',
    important: false,
    content: '설 연휴 기간에도 365일 정상 운영됩니다. 명절 간병이 필요하신 분은 미리 예약해주세요.',
  },
  {
    id: 5,
    title: '[안내] 안전 간병 2주년 기념 감사 이벤트',
    date: '2026-01-01',
    important: false,
    content: '다사랑 간병이 안전 간병 2주년을 맞이했습니다. 신규 신청 고객님께 첫 주 10% 할인 혜택을 드립니다.',
  },
];

export default function NoticePage() {
  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '4rem 1.5rem' }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📢</div>
        <h1 style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          fontWeight: 'bold',
          color: '#4A7C59',
          marginBottom: '0.5rem',
        }}>
          공지사항
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: '0.9375rem' }}>
          다사랑 간병의 새로운 소식을 전해드립니다
        </p>
      </div>

      {/* 공지 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {notices.map((notice) => (
          <details key={notice.id} style={{
            background: 'white',
            borderRadius: '1rem',
            boxShadow: '0 2px 10px rgba(139, 119, 90, 0.06)',
            overflow: 'hidden',
          }}>
            <summary style={{
              padding: '1.25rem 1.5rem',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              listStyle: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#3D3929',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                {notice.important && (
                  <span style={{
                    background: '#E65100',
                    color: 'white',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.6875rem',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}>
                    중요
                  </span>
                )}
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {notice.title}
                </span>
              </div>
              <span style={{
                color: '#9CA3AF',
                fontSize: '0.8125rem',
                flexShrink: 0,
              }}>
                {notice.date}
              </span>
            </summary>
            <div style={{
              padding: '0 1.5rem 1.5rem 1.5rem',
              color: '#6B7280',
              lineHeight: 1.7,
              fontSize: '0.9375rem',
              borderTop: '1px solid #F0E8D8',
              paddingTop: '1rem',
            }}>
              {notice.content}
            </div>
          </details>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
        <Link href="/inquiry" style={{
          display: 'inline-block',
          padding: '0.75rem 2rem',
          borderRadius: '0.75rem',
          border: '1.5px solid #E8D5C4',
          color: '#6B5E4A',
          fontWeight: 500,
          textDecoration: 'none',
          fontSize: '0.9375rem',
        }}>
          문의하기
        </Link>
      </div>
    </div>
  );
}
