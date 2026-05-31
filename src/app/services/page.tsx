import Link from 'next/link';

export default function ServicesPage() {
  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '5rem 1.5rem' }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🌿</div>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 'bold',
          color: '#4A7C59',
          marginBottom: '1rem',
          lineHeight: 1.3,
        }}>
          간병 서비스
        </h1>
        <p style={{
          color: '#6B7280',
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          maxWidth: '40rem',
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          환자 한 분 한 분의 상태에 맞춘 맞춤형 간병으로
          <br />정성을 다해 돌보겠습니다
        </p>
      </div>

      {/* 메인 서비스 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem',
        marginBottom: '6rem',
      }}>
        {services.map((s, i) => (
          <div key={i} style={{
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2.5rem 2rem',
            boxShadow: '0 4px 20px rgba(139, 119, 90, 0.1)',
            borderTop: '4px solid #5B8C5A',
            transition: 'transform 0.2s',
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>{s.icon}</div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#4A7C59',
              marginBottom: '0.75rem',
            }}>
              {s.title}
            </h3>
            <p style={{
              color: '#6B7280',
              fontSize: '1.0625rem',
              lineHeight: 1.7,
              marginBottom: '1.25rem',
            }}>
              {s.desc}
            </p>
            <ul style={{
              padding: 0,
              listStyle: 'none',
              fontSize: '0.9375rem',
              color: '#5B6E4A',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              {s.details.map((d, j) => (
                <li key={j} style={{
                  display: 'flex',
                  gap: '0.625rem',
                  alignItems: 'flex-start',
                  lineHeight: 1.5,
                }}>
                  <span style={{
                    color: '#7BAE7F',
                    flexShrink: 0,
                    fontWeight: 'bold',
                  }}>✓</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 🔥 차별화 서비스 */}
      <div style={{ marginBottom: '6rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-block',
            background: '#FFF3E0',
            color: '#E65100',
            padding: '0.625rem 1.5rem',
            borderRadius: '2rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
          }}>
            🔥 다사랑만의 차별화
          </div>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 'bold',
            color: '#4A7C59',
            marginBottom: '1rem',
          }}>
            타사와 다른 이유
          </h2>
          <p style={{ color: '#6B7280', fontSize: '1.125rem', maxWidth: '36rem', margin: '0 auto' }}>
            실제 간병 서비스 이용자들의 불만을 분석하여 만들었습니다
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.75rem',
        }}>
          {differentiators.map((d, i) => (
            <div key={i} style={{
              background: 'linear-gradient(180deg, #FFFDF7 0%, #FFF9EE 100%)',
              borderRadius: '1.25rem',
              padding: '2rem',
              border: '1.5px solid rgba(232, 168, 124, 0.25)',
            }}>
              <div style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                marginBottom: '1rem',
              }}>
                <div style={{
                  background: '#E8F5E9',
                  borderRadius: '1rem',
                  width: '3.5rem',
                  height: '3.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  flexShrink: 0,
                }}>
                  {d.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#4A7C59',
                    marginBottom: '0.375rem',
                  }}>
                    {d.title}
                  </h3>
                  <p style={{
                    fontSize: '0.9375rem',
                    color: '#E65100',
                    fontWeight: 500,
                    background: '#FFF3E0',
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.5rem',
                  }}>
                    💬 "{d.solves}"
                  </p>
                </div>
              </div>
              <p style={{
                color: '#4A4A3A',
                fontSize: '0.9375rem',
                lineHeight: 1.7,
              }}>
                {d.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 간병 절차 */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          fontWeight: 'bold',
          color: '#4A7C59',
          marginBottom: '0.75rem',
        }}>
          간병 절차
        </h2>
        <p style={{ color: '#6B7280', fontSize: '1.125rem' }}>
          상담부터 간병 시작까지, 투명하게 진행됩니다
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '4rem',
      }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            background: 'white',
            borderRadius: '1.25rem',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            boxShadow: '0 3px 16px rgba(139, 119, 90, 0.08)',
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: '#E8F5E9',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: '#4A7C59',
              fontWeight: 'bold',
              fontSize: '1.5rem',
            }}>
              {i + 1}
            </div>
            <h3 style={{
              fontWeight: 'bold',
              color: '#4A7C59',
              marginBottom: '0.5rem',
              fontSize: '1.125rem',
            }}>
              {s.title}
            </h3>
            <p style={{ color: '#6B7280', fontSize: '0.9375rem', lineHeight: 1.5 }}>
              {s.desc}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}

const services = [
  {
    icon: '🍽️', title: '식사보조',
    desc: '환자의 식사 능력과 필요에 맞춰 안전하게 식사를 보조합니다.',
    details: ['일반식사 보조', '경관식사 관리', '식사량·영양 체크', '식이 알레르기 관리'],
  },
  {
    icon: '🚶', title: '활동보조',
    desc: '보행, 체위변경, 이동 등 일상 활동을 안전하게 도와드립니다.',
    details: ['보행·이동 보조', '체위변경 (욕창예방)', '낙상방지 모니터링', '재활운동 보조'],
  },
  {
    icon: '🚽', title: '배변보조',
    desc: '환자의 존엄성을 지키며 쾌적하게 배변을 도와드립니다.',
    details: ['화장실 보조', '기저귀 교체', '배변 횟수·상태 기록', '장루/카테터 관리'],
  },
  {
    icon: '🚿', title: '위생보조',
    desc: '세면, 목욕, 구강관리 등 청결하고 쾌적한 상태를 유지합니다.',
    details: ['세면·양치 보조', '목욕/샤워', '환의·침구 교체', '욕창예방 피부관리'],
  },
  {
    icon: '💊', title: '투약·건강관리',
    desc: '처방된 약물을 정확한 시간에 맞춰 투여하고 건강을 체크합니다.',
    details: ['투약 시간 관리', '혈압·체온·혈당 측정', '이상징후 즉시 보고', '투약 달력 제공'],
  },
  {
    icon: '💬', title: '정서 지원',
    desc: '대화와 공감으로 환자의 정서적 안정을 돕습니다.',
    details: ['말벗·정서적 지지', '인지 자극 활동', '가족 영상통화 연결', '음악·회상 요법'],
  },
];

const differentiators = [
  {
    icon: '📍',
    title: '실시간 위치 확인',
    solves: '"간병인이 자꾸 사라져요"',
    desc: 'GPS 기반 출퇴근 기록으로 보호자님이 실시간으로 간병인의 위치와 근무 시간을 확인할 수 있습니다. 무단이탈·지각을 원천 차단합니다.',
  },
  {
    icon: '📋',
    title: '일일 간병 보고서',
    solves: '"오늘 뭐 했는지 전혀 몰라요"',
    desc: '매일 식사·활동·배변·위생·투약 내역을 앱으로 기록하여 보호자에게 실시간 공유합니다. 간병 내용이 투명하게 관리됩니다.',
  },
  {
    icon: '🔄',
    title: '체계적 인수인계',
    solves: '"간병인 바뀔 때마다 처음부터 다시 설명"',
    desc: '전담 간병인 교체 시 디지털 인수인계 시스템으로 환자 상태, 주의사항, 선호사항을 빠짐없이 전달합니다.',
  },
  {
    icon: '💰',
    title: '투명한 비용 정산',
    solves: '"추가 요금이 자꾸 생겨요"',
    desc: '계약 시 모든 비용을 명시하고, 추가 비용 발생 시 사전 동의를 받습니다. 월간 사용 확인서로 모든 내역을 투명하게 공개합니다.',
  },
  {
    icon: '🎓',
    title: '검증된 간병인',
    solves: '"간병인 태도가 너무 불성실해요"',
    desc: '모든 간병인은 40시간 전문교육 이수 + 인성검증 + 범죄이력 조회를 통과한 분들만 배정합니다. 정기적인 서비스 평가로 품질을 유지합니다.',
  },
  {
    icon: '🚨',
    title: '24시간 응급 대응',
    solves: '"밤에 응급상황인데 연락이 안 돼요"',
    desc: '간병인-관리자-보호자 3자 비상연락망 구축. 야간에도 관리자가 상시 대기하여 응급상황 발생 시 즉시 대응합니다.',
  },
  {
    icon: '📱',
    title: '보호자 앱 연동',
    solves: '"병원에 못 가니 너무 불안해요"',
    desc: '전용 앱으로 멀리서도 환자 상태·간병 내역·사진을 확인할 수 있습니다. 바쁜 보호자님도 안심하고 일상에 집중하세요.',
  },
  {
    icon: '🔒',
    title: '소지품 보안 관리',
    solves: '"귀중품이 없어졌어요"',
    desc: '간병 시작 시 환자 소지품을 함께 체크리스트로 기록하고, 책임 소재를 명확히 합니다. CCTV 설치 병원과 협력하여 안전을 강화합니다.',
  },
];

const steps = [
  { title: '무료 상담', desc: '환자 상태와 필요 서비스를 상세히 파악합니다' },
  { title: '맞춤 견적', desc: '투명한 비용으로 맞춤형 플랜을 제안합니다' },
  { title: '간병인 매칭', desc: '검증된 간병인 중 최적의 인력을 배정합니다' },
  { title: '간병 시작', desc: '실시간 보고서와 함께 체계적인 간병이 시작됩니다' },
];
