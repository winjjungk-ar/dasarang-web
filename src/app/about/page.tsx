import Link from 'next/link';

export default function AboutPage() {
  return (
    <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '5rem 1.5rem' }}>
      {/* Hero */}
      <div style={{
        textAlign: 'center',
        marginBottom: '5rem',
        background: 'linear-gradient(180deg, #FEFBF6 0%, white 100%)',
        borderRadius: '2rem',
        padding: '4rem 2rem',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🌿</div>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 'bold',
          color: '#4A7C59',
          marginBottom: '1rem',
          lineHeight: 1.3,
        }}>
          다사랑 간병을<br />소개합니다
        </h1>
        <p style={{
          color: '#6B7280',
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          maxWidth: '36rem',
          margin: '0 auto',
          lineHeight: 1.7,
        }}>
          따뜻한 손길, 정성이 담긴 간병으로<br />
          환자와 가족 모두가 안심할 수 있는 서비스를 만듭니다
        </p>
      </div>

      {/* 핵심 성과 — 눈에 띄는 숫자 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '5rem',
      }}>
        {[
          { num: '2년', label: '간병 서비스 경력', icon: '📅', color: '#4A7C59' },
          { num: '무사고', label: '단 한 건의 사고도 없이', icon: '🛡️', color: '#E65100', big: true },
          { num: '100%', label: '고객 만족 응답', icon: '💚', color: '#4A7C59' },
          { num: '24시간', label: '365일 응급 대응', icon: '⏰', color: '#5B8C5A' },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: 'white',
            borderRadius: '1.5rem',
            padding: stat.big ? '2.5rem 1.5rem' : '2rem 1.5rem',
            textAlign: 'center',
            boxShadow: stat.big
              ? '0 8px 30px rgba(230, 81, 0, 0.15), 0 2px 8px rgba(139, 119, 90, 0.1)'
              : '0 3px 16px rgba(139, 119, 90, 0.08)',
            border: stat.big ? '2px solid #FFCC80' : '1px solid #F0E8D8',
            position: 'relative',
            ...(stat.big ? {} : {}),
          }}>
            {stat.big && (
              <div style={{
                position: 'absolute',
                top: '-0.75rem',
                right: '-0.75rem',
                background: '#E65100',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: 'bold',
              }}>
                ★ 자랑
              </div>
            )}
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
            <div style={{
              fontSize: stat.big ? '2rem' : '1.75rem',
              fontWeight: 'bold',
              color: stat.color,
              marginBottom: '0.5rem',
            }}>
              {stat.num}
            </div>
            <div style={{ color: '#6B7280', fontSize: '0.9375rem' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* 고객만족 강조 문구 */}
      <div style={{
        background: 'linear-gradient(135deg, #FFF3E0 0%, #FFF8E1 50%, #E8F5E9 100%)',
        borderRadius: '2rem',
        padding: '3rem 2rem',
        textAlign: 'center',
        marginBottom: '5rem',
        border: '1.5px solid rgba(230, 152, 62, 0.2)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🌟</div>
        <h2 style={{
          fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
          fontWeight: 'bold',
          color: '#4A7C59',
          marginBottom: '1rem',
          lineHeight: 1.4,
        }}>
          "단 한 분의 고객님도<br />소중하지 않은 분이 없습니다"
        </h2>
        <p style={{
          color: '#6B7280',
          fontSize: '1.0625rem',
          maxWidth: '32rem',
          margin: '0 auto 2rem auto',
          lineHeight: 1.7,
        }}>
          다사랑 간병은 지난 2년간 단 한 건의 안전사고 없이<br />
          <strong style={{ color: '#4A7C59' }}>모든 고객님께 최상의 간병 서비스</strong>를 제공해왔습니다.<br />
          앞으로도 변함없는 정성과 신뢰로 보답하겠습니다.
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          {['🛡️ 안전 최우선', '💚 정성 간병', '🤝 투명한 소통', '🏆 검증된 전문성'].map(tag => (
            <span key={tag} style={{
              background: 'white',
              padding: '0.625rem 1.25rem',
              borderRadius: '2rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#4A7C59',
              boxShadow: '0 2px 8px rgba(139, 119, 90, 0.08)',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 제천 명지병원 협력 */}
      <div style={{
        background: 'white',
        borderRadius: '1.5rem',
        padding: '2.5rem',
        boxShadow: '0 3px 16px rgba(139, 119, 90, 0.08)',
        marginBottom: '2rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '2rem' }}>🏥</span>
          <div>
            <h3 style={{ fontSize: '1.375rem', fontWeight: 'bold', color: '#4A7C59' }}>
              제천 명지병원 협력
            </h3>
            <span style={{
              background: '#E3F2FD',
              color: '#1565C0',
              padding: '0.15rem 0.625rem',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}>
              공동간병인 서비스
            </span>
          </div>
        </div>

        <div style={{
          background: '#F5F9F5',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '1.25rem',
        }}>
          <p style={{
            color: '#3D3929',
            fontSize: '0.9375rem',
            lineHeight: 1.7,
            marginBottom: '0.75rem',
          }}>
            다사랑 간병은 <strong style={{ color: '#4A7C59' }}>제천 명지병원</strong>의 공동간병인 서비스에 참여하여<br />
            <strong>간병비 부담은 절반으로 줄이고, 간병의 질은 두 배로 높였습니다.</strong>
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { icon: '💰', text: '개인 간병비 대비\n50% 비용 절감' },
              { icon: '👥', text: '주·야간 2인 1조\n세심한 간병' },
              { icon: '✅', text: '간병인 상주로\n의료진 치료 전념' },
              { icon: '📈', text: '환자 만족도\n대폭 향상' },
            ].map(item => (
              <div key={item.text} style={{
                background: 'white',
                borderRadius: '0.75rem',
                padding: '0.875rem 1rem',
                textAlign: 'center',
                minWidth: '120px',
                flex: '1 1 auto',
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>{item.icon}</div>
                <div style={{ fontSize: '0.75rem', color: '#4A7C59', fontWeight: 600, whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          borderLeft: '3px solid #7BAE7F',
          paddingLeft: '1rem',
          color: '#6B7280',
          fontSize: '0.8125rem',
          lineHeight: 1.6,
          fontStyle: 'italic',
        }}>
          "간병서비스의 질을 계속 높일 수 있도록 간병회사와 유기적 협의와 모니터링을 실시해 나갈 것"<br />
          <span style={{ color: '#9CA3AF', fontStyle: 'normal' }}>— 이양규 제천명지병원 원무팀장</span>
          <br />
          <span style={{ color: '#B0B0B0', fontSize: '0.6875rem', fontStyle: 'normal' }}>
            출처: 아시아뉴스통신 (2014.05.24)
          </span>
        </div>
      </div>

      {/* 소속 정보 */}
      <div style={{
        background: 'white',
        borderRadius: '1.5rem',
        padding: '2.5rem',
        boxShadow: '0 3px 16px rgba(139, 119, 90, 0.08)',
        marginBottom: '3rem',
      }}>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#4A7C59',
          marginBottom: '1.5rem',
          textAlign: 'center',
        }}>
          📋 회사 정보
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}>
          {[
            { label: '단체명', value: '다사랑 간병공동체' },
            { label: '소속', value: '제천지역자활센터' },
            { label: '사업자번호', value: '141-94-02083' },
            { label: '서비스 지역', value: '충주시 · 제천시 · 영월군' },
            { label: '운영 기간', value: '2024년 ~ 현재 (2년)' },
            { label: '안전 기록', value: '🛡️ 무사고 2년' },
          ].map(info => (
            <div key={info.label} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              background: '#FEFBF6',
              borderRadius: '0.75rem',
            }}>
              <span style={{ color: '#6B7280', fontSize: '0.9375rem' }}>{info.label}</span>
              <span style={{ fontWeight: 600, color: '#3D3929', fontSize: '0.9375rem' }}>{info.value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
