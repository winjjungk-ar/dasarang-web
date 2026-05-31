import Link from 'next/link';

const faqs = [
  {
    q: '간병 비용은 얼마인가요?',
    a: '환자분의 상태와 필요하신 서비스에 따라 달라집니다. 무료 상담을 통해 정확한 견적을 안내해드립니다. 추가 비용 없이 투명하게 정산해드리는 것을 약속드립니다.',
  },
  {
    q: '24시간 간병이 가능한가요?',
    a: '네, 24시간 상주 간병이 가능합니다. 주간·야간 교대 시스템으로 간병인의 피로를 관리하여 안전하고 질 높은 서비스를 제공합니다.',
  },
  {
    q: '서비스 지역이 어디까지인가요?',
    a: '현재 충주시, 제천시, 영월군 전 지역에서 서비스를 제공하고 있습니다. 그 외 지역도 문의 주시면 최대한 도와드리겠습니다.',
  },
  {
    q: '간병인은 어떻게 선발되나요?',
    a: '모든 간병인은 40시간 전문교육 이수, 인성검증, 범죄이력 조회를 통과한 분들만 배정됩니다. 정기적인 서비스 평가로 품질을 유지하고 있습니다.',
  },
  {
    q: '간병 중 문제가 생기면 어떻게 하나요?',
    a: '간병인-관리자-보호자 3자 비상연락망이 구축되어 있어 언제든지 즉시 대응이 가능합니다. 야간에도 관리자가 상시 대기합니다.',
  },
  {
    q: '입원 병원은 어디든 가능한가요?',
    a: '서비스 지역 내 병원이면 어디든 가능합니다. 다만, 병원 측의 개인 간병인 허용 여부는 사전에 확인이 필요합니다.',
  },
  {
    q: '계약은 어떻게 진행되나요?',
    a: '무료 상담 → 맞춤 견적 → 계약서 작성 순으로 진행됩니다. 모든 비용은 계약서에 명시되며, 추가 비용은 사전 동의 후에만 발생합니다.',
  },
  {
    q: '단기 간병도 가능한가요?',
    a: '네, 1일 단기 간병부터 장기 간병까지 모두 가능합니다. 갑작스러운 상황에도 유연하게 대응해드립니다.',
  },
];

export default function FAQPage() {
  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '4rem 1.5rem' }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</div>
        <h1 style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          fontWeight: 'bold',
          color: '#4A7C59',
          marginBottom: '0.5rem',
        }}>
          자주 묻는 질문
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: '0.9375rem' }}>
          궁금하신 점을 빠르게 확인하세요
        </p>
      </div>

      {/* FAQ 아코디언 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {faqs.map((faq, i) => (
          <details key={i} style={{
            background: 'white',
            borderRadius: '1rem',
            boxShadow: '0 2px 10px rgba(139, 119, 90, 0.06)',
            overflow: 'hidden',
          }}>
            <summary style={{
              padding: '1.25rem 1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              listStyle: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#3D3929',
            }}>
              <span style={{
                color: '#7BAE7F',
                fontSize: '1.25rem',
                flexShrink: 0,
              }}>
                Q
              </span>
              <span style={{ flex: 1 }}>{faq.q}</span>
            </summary>
            <div style={{
              padding: '0 1.5rem 1.25rem 1.5rem',
              borderTop: '1px solid #F0E8D8',
              paddingTop: '0.75rem',
              marginLeft: '2.25rem',
            }}>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                color: '#5B8C5A',
                lineHeight: 1.7,
                fontSize: '0.9375rem',
              }}>
                <span style={{
                  color: '#5B8C5A',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  flexShrink: 0,
                }}>
                  A
                </span>
                <span>{faq.a}</span>
              </div>
            </div>
          </details>
        ))}
      </div>

      {/* 추가 문의 */}
      <div style={{
        textAlign: 'center',
        marginTop: '2.5rem',
        padding: '2rem',
        background: 'white',
        borderRadius: '1rem',
        boxShadow: '0 2px 10px rgba(139, 119, 90, 0.06)',
      }}>
        <p style={{ color: '#6B7280', marginBottom: '1rem', fontSize: '0.9375rem' }}>
          원하시는 답변을 찾지 못하셨나요?
        </p>
        <Link href="/inquiry" style={{
          display: 'inline-block',
          background: '#5B8C5A',
          color: 'white',
          padding: '0.875rem 2rem',
          borderRadius: '0.75rem',
          fontWeight: 'bold',
          textDecoration: 'none',
          fontSize: '1rem',
        }}>
          💚 문의하기
        </Link>
      </div>
    </div>
  );
}
