import Link from 'next/link';
import CountUp from '@/components/CountUp';
import ServiceMap from '@/components/ServiceMap';
import ReviewSection from '@/components/ReviewSection';
import { getBlogPosts, isNewPost } from '@/lib/blog';

export default function HomePage() {
function getSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

const season = getSeason();

const seasonData = {
  spring: {
    name: '봄',
    emoji: '🌸🌱',
    gradient: 'linear-gradient(165deg, #D4838F 0%, #E8A87C 25%, #F3C98B 50%, #D4A5A5 75%, #E8D5B7 100%)',
    textColor: '#FFF5F0',
  },
  summer: {
    name: '여름',
    emoji: '🌿☀️',
    gradient: 'linear-gradient(165deg, #4A7C59 0%, #5B8C5A 25%, #6B9B5A 50%, #8DB580 75%, #A8C898 100%)',
    textColor: '#FDF6EC',
  },
  fall: {
    name: '가을',
    emoji: '🍂🍁',
    gradient: 'linear-gradient(165deg, #C17817 0%, #D4953B 25%, #E0A85C 50%, #C9A96E 75%, #B8956A 100%)',
    textColor: '#FFF8F0',
  },
  winter: {
    name: '겨울',
    emoji: '❄️⛄',
    gradient: 'linear-gradient(165deg, #7B9DB5 0%, #8BACC4 25%, #9BBDD4 50%, #B5CCDE 75%, #C8D9E8 100%)',
    textColor: '#F0F5FA',
  },
};

const currentSeason = seasonData[season as keyof typeof seasonData];

  return (
    <>
      {/* Hero Section — 2-column layout */}
      <section style={{
        background: currentSeason.gradient,
        position: 'relative',
        overflow: 'hidden',
        color: 'white',
      }}>
        <div style={{
          maxWidth: '72rem',
          margin: '0 auto',
          padding: '4rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '3rem',
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* 왼쪽 — 텍스트 */}
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', marginBottom: '0.5rem' }}>{currentSeason.emoji}</div>
            <h1 style={{
              fontSize: 'clamp(1.75rem, 4.5vw, 2.75rem)',
              fontWeight: 'bold',
              lineHeight: 1.3,
              marginBottom: '1rem',
            }}>
              따뜻한 {currentSeason.name},<br />
              <span style={{ color: currentSeason.textColor }}>정성이 담긴 간병</span>
            </h1>
            <p style={{
              fontSize: 'clamp(0.9375rem, 1.5vw, 1.125rem)',
              opacity: 0.85,
              marginBottom: '2rem',
              lineHeight: 1.7,
            }}>
              사랑하는 가족을 위한 진심 어린 돌봄.<br />
              다사랑 간병이 함께하겠습니다.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <Link href="/inquiry" style={{
                display: 'inline-block',
                background: 'white',
                color: '#5B8C5A',
                padding: '0.875rem 1.75rem',
                borderRadius: '1rem',
                fontWeight: 'bold',
                fontSize: '1rem',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}>
                접수현황
              </Link>
              <Link href="/services" style={{
                display: 'inline-block',
                border: '2px solid rgba(255,255,255,0.5)',
                color: 'white',
                padding: '0.875rem 1.75rem',
                borderRadius: '1rem',
                fontWeight: 'bold',
                fontSize: '1rem',
                textDecoration: 'none',
              }}>
                서비스 알아보기
              </Link>
            </div>
          </div>

          {/* 오른쪽 — 할머니 사진 */}
          <div style={{
            flex: '1 1 320px',
            minWidth: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <div style={{
              width: '100%',
              maxWidth: '420px',
              aspectRatio: '4/3',
              borderRadius: '1.5rem',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              border: '3px solid rgba(255,255,255,0.2)',
            }}>
              <img
                src="/hero-grandmother.jpg"
                alt="따뜻한 간병"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CountUp Section */}
      <section style={{ padding: '4rem 0', background: 'white' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#5B8C5A', marginBottom: '0.5rem' }}>
              숫자로 보는 다사랑 간병
            </h2>
            <p style={{ color: '#6B7280', fontSize: '0.9375rem' }}>
              신뢰할 수 있는 이유, 숫자가 증명합니다
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.25rem',
          }}>
            <CountUp end={2} suffix="년" label="안전 간병 경력" icon="🛡️" color="#E65100" highlight />
            <CountUp end={1200} suffix="+" label="누적 간병 일수" icon="📅" color="#4A7C59" />
            <CountUp end={100} suffix="%" label="고객 만족도" icon="💚" color="#4A7C59" />
            <CountUp end={24} prefix="365일 " suffix="시간" label="응급 대응 체계" icon="⏰" color="#5B8C5A" />
          </div>
        </div>
      </section>

      {/* 최신 간병 정보 */}
      {(() => {
        const latestPosts = getBlogPosts().slice(0, 2);
        if (latestPosts.length === 0) return null;
        return (
          <section style={{ padding: '4rem 0', background: 'white' }}>
            <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1rem' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '2rem', flexWrap: 'wrap', gap: '0.5rem',
              }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#5B8C5A', marginBottom: '0.25rem' }}>
                    📝 최신 간병 정보
                  </h2>
                  <p style={{ color: '#6B7280', fontSize: '0.9375rem' }}>
                    간병에 도움되는 최신 정보를 확인하세요
                  </p>
                </div>
                <a href="/blog" style={{
                  color: '#4A7C59', fontWeight: 600, textDecoration: 'none',
                  padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '2px solid #4A7C59',
                  fontSize: '0.875rem', whiteSpace: 'nowrap',
                }}>
                  전체보기 →
                </a>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.25rem',
              }}>
                {latestPosts.map((post) => (
                  <a key={post.slug} href={`/blog/${post.slug}`} style={{
                    background: '#FEFBF6',
                    borderRadius: '1.25rem',
                    padding: '1.75rem',
                    textDecoration: 'none',
                    color: 'inherit',
                    border: '1px solid #F0E8D8',
                    boxShadow: '0 2px 12px rgba(139, 119, 90, 0.08)',
                    position: 'relative',
                    display: 'flex', flexDirection: 'column', gap: '0.625rem',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}>
                    {isNewPost(post.date) && (
                      <span style={{
                        position: 'absolute', top: '0.75rem', right: '0.75rem',
                        background: '#E65100', color: 'white',
                        padding: '0.2rem 0.5rem', borderRadius: '0.5rem',
                        fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.05em',
                      }}>NEW</span>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {post.tags.slice(0, 2).map((tag) => (
                        <span key={tag} style={{
                          background: '#E8F5E9', color: '#4A7C59',
                          padding: '0.15rem 0.5rem', borderRadius: '0.75rem',
                          fontSize: '0.6875rem', fontWeight: 600,
                        }}>#{tag}</span>
                      ))}
                    </div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#3D3929', lineHeight: 1.4 }}>
                      {post.title}
                    </h3>
                    <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: 1.6 }}>
                      {post.excerpt}
                    </p>
                    <div style={{ color: '#9CA3AF', fontSize: '0.75rem', marginTop: 'auto' }}>
                      {post.date}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

            {/* Dual CTA Block */}
      <section style={{ padding: '3rem 0', background: 'white' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {/* 간병 문의하기 */}
            <a href="/inquiry/new" style={{
              background: 'linear-gradient(135deg, #4A7C59 0%, #5B8C5A 50%, #8DB580 100%)',
              borderRadius: '1.5rem',
              padding: '3rem 2rem',
              textDecoration: 'none',
              color: 'white',
              boxShadow: '0 6px 24px rgba(74, 124, 89, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              transition: 'transform 0.2s',
            }}>
              <div style={{ fontSize: '4rem', lineHeight: 1 }}>💚</div>
              <div style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 'bold',
                textAlign: 'center',
              }}>
                간병 문의하기
              </div>
              <div style={{
                fontSize: 'clamp(0.9375rem, 1.5vw, 1.125rem)',
                opacity: 0.85,
                textAlign: 'center',
                lineHeight: 1.6,
              }}>
                환자분 정보를 남겨주시면<br />24시간 이내에 상담해드립니다
              </div>
              <div style={{
                marginTop: '0.5rem',
                background: 'rgba(255,255,255,0.2)',
                padding: '0.625rem 1.5rem',
                borderRadius: '2rem',
                fontSize: '1rem',
                fontWeight: 600,
              }}>
                작성하러 가기 →
              </div>
            </a>

            {/* 간병인 지원하기 */}
            <a href="/recruit" style={{
              background: 'linear-gradient(135deg, #E65100 0%, #F57C00 50%, #FFB74D 100%)',
              borderRadius: '1.5rem',
              padding: '3rem 2rem',
              textDecoration: 'none',
              color: 'white',
              boxShadow: '0 6px 24px rgba(230, 81, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              transition: 'transform 0.2s',
            }}>
              <div style={{ fontSize: '4rem', lineHeight: 1 }}>🤝</div>
              <div style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 'bold',
                textAlign: 'center',
              }}>
                간병인 지원하기
              </div>
              <div style={{
                fontSize: 'clamp(0.9375rem, 1.5vw, 1.125rem)',
                opacity: 0.85,
                textAlign: 'center',
                lineHeight: 1.6,
              }}>
                함께 일하실 간병인을 모집합니다<br />경쟁력 있는 급여 · 무료 교육
              </div>
              <div style={{
                marginTop: '0.5rem',
                background: 'rgba(255,255,255,0.2)',
                padding: '0.625rem 1.5rem',
                borderRadius: '2rem',
                fontSize: '1rem',
                fontWeight: 600,
              }}>
                지원하러 가기 →
              </div>
            </a>
          </div>
        </div>
      </section>


      {/* Values Section */}
      <section style={{ padding: '4rem 0', background: '#FEFBF6' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#5B8C5A', marginBottom: '0.75rem' }}>다사랑의 약속</h2>
            <p style={{ color: '#6B7280', maxWidth: '36rem', margin: '0 auto' }}>
              우리는 환자 한 분 한 분을 가족처럼 모십니다
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {values.map((v) => (
              <div key={v.title} style={{
                background: 'white',
                borderRadius: '1.25rem',
                padding: '2rem',
                textAlign: 'center',
                boxShadow: '0 2px 12px rgba(139, 119, 90, 0.08)',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{v.icon}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#5B8C5A', marginBottom: '0.5rem' }}>{v.title}</h3>
                <p style={{ color: '#6B7280', lineHeight: 1.6 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section style={{ padding: '4rem 0', background: 'white' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#5B8C5A', marginBottom: '0.75rem' }}>간병 서비스</h2>
            <p style={{ color: '#6B7280' }}>환자의 상태와 필요에 맞춘 맞춤형 간병</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {services.map((s) => (
              <div key={s.title} style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                background: '#FEFBF6',
                borderRadius: '1rem',
                padding: '1.5rem',
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  background: '#E8F5E9',
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {s.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#5B8C5A', marginBottom: '0.375rem' }}>{s.title}</h3>
                  <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/services" style={{
              display: 'inline-block',
              border: '2px solid #5B8C5A',
              color: '#5B8C5A',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              fontWeight: '500',
              textDecoration: 'none',
            }}>
              모든 서비스 보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews Section — Firebase-powered */}
      <ReviewSection />

      {/* 협력 병원 Section */}
      <section style={{ padding: '3rem 0', background: '#F8FAF8' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🏥</div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#5B8C5A', marginBottom: '0.75rem' }}>
            함께하는 의료기관
          </h2>
          <p style={{ color: '#6B7280', fontSize: '1rem', marginBottom: '2rem' }}>
            믿을 수 있는 협력 병원과 함께합니다
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '2rem',
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1.25rem',
              padding: '2rem 3rem',
              boxShadow: '0 3px 16px rgba(139, 119, 90, 0.1)',
              border: '1px solid #E8F5E9',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              {/* 제천명지병원 로고 */}
              <img
                src="/hospital-mj.png"
                alt="제천명지병원"
                style={{
                  height: '3rem',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
              <div style={{ fontWeight: 700, fontSize: '1.125rem', color: '#3D3929' }}>제천명지병원</div>
              <div style={{ fontSize: '0.8125rem', color: '#9CA3AF' }}>협력 병원</div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Area Section with Map */}
      <section style={{ padding: '4rem 0', background: 'white' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📍</div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#5B8C5A', marginBottom: '0.75rem' }}>
              서비스 지역
            </h2>
            <p style={{ color: '#6B7280', fontSize: '1rem' }}>
              충청북도 북부권 중심, 언제든지 찾아갑니다
            </p>
          </div>

          {/* Map */}
          <div style={{
            width: '100%',
            height: '380px',
            borderRadius: '1.25rem',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(139, 119, 90, 0.12)',
            marginBottom: '2rem',
            border: '1px solid #E8D5C4',
          }}>
            <ServiceMap />
          </div>

          {/* City cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
          }}>
            {[
              { city: '제천시', desc: '전 지역 방문 간병', icon: '🏔️', color: '#4A7C59', tag: '중심지' },
              { city: '충주시', desc: '전 지역 방문 간병', icon: '🏙️', color: '#5B8C5A', tag: '확대' },
              { city: '영월군', desc: '전 지역 방문 간병', icon: '🌄', color: '#6B9B5A', tag: '신규' },
            ].map((area) => (
              <div key={area.city} style={{
                background: '#FEFBF6',
                borderRadius: '1rem',
                padding: '1.5rem',
                textAlign: 'center',
                border: '1px solid #F0E8D8',
              }}>
                <div style={{
                  display: 'inline-block',
                  background: area.color,
                  color: 'white',
                  padding: '0.2rem 0.625rem',
                  borderRadius: '1rem',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                }}>{area.tag}</div>
                <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{area.icon}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: area.color }}>{area.city}</h3>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>{area.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section style={{ padding: '4rem 0', background: '#FEFBF6' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#5B8C5A', marginBottom: '0.5rem' }}>
              더 알아보기
            </h2>
            <p style={{ color: '#6B7280' }}>다사랑 간병에 대한 더 많은 정보를 확인하세요</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.25rem',
          }}>
            {[
              { href: '/about', icon: '🌿', title: '회사 소개', desc: '안전 간병, 높은 만족도', badge: '🏆 신뢰', bg: '#E8F5E9', color: '#4A7C59' },
              { href: '/documents', icon: '📂', title: '서류 발급', desc: '간병일지·확인서·증명서 발급', badge: '📋 업무', bg: '#FFF3E0', color: '#E65100' },
              { href: '/notice', icon: '📢', title: '공지사항', desc: '새로운 소식과 이벤트', badge: '📌 알림', bg: '#F0F7F0', color: '#5B8C5A' },
              { href: '/blog', icon: '📝', title: '간병 정보', desc: '유용한 정보와 최신 가이드', badge: '📰 정보', bg: '#FFF8E1', color: '#F57C00' },
              { href: '/faq', icon: '💬', title: '자주 묻는 질문', desc: '궁금증을 빠르게 해결', badge: '❓ 도움말', bg: '#F5FAF5', color: '#6B9B5A' },
            ].map((link) => (
              <a key={link.href} href={link.href} style={{
                background: 'white',
                borderRadius: '1.25rem',
                padding: '2rem',
                textDecoration: 'none',
                color: 'inherit',
                boxShadow: '0 3px 14px rgba(139, 119, 90, 0.07)',
                border: '1px solid #F0E8D8',
                display: 'block',
              }}>
                <div style={{ display: 'inline-block', background: link.bg, padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, color: link.color, marginBottom: '0.75rem' }}>{link.badge}</div>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{link.icon}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: link.color, marginBottom: '0.375rem' }}>{link.title}</h3>
                <p style={{ color: '#6B7280', fontSize: '0.9375rem' }}>{link.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '4rem 0', background: '#5B8C5A' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1rem', textAlign: 'center', color: 'white' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>지금 상담해보세요</h2>
          <p style={{ opacity: 0.8, marginBottom: '2rem', maxWidth: '32rem', margin: '0 auto 2rem auto', fontSize: '1rem' }}>
            문의사항을 남겨주시면 빠르게 답변드리겠습니다.<br />
            환자 상태를 자세히 적어주시면 더 정확한 상담이 가능합니다.
          </p>
          <Link href="/inquiry" style={{
            display: 'inline-block',
            background: 'white',
            color: '#5B8C5A',
            padding: '1rem 2.5rem',
            borderRadius: '1rem',
            fontWeight: 'bold',
            fontSize: '1.125rem',
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            무료 상담 신청
          </Link>
        </div>
      </section>
    </>
  );
}

const values = [
  { icon: '💚', title: '진심', desc: '환자를 내 가족처럼 생각하는 마음으로 정성을 다해 간병합니다.' },
  { icon: '🤝', title: '신뢰', desc: '투명한 간병 기록과 정직한 서비스로 신뢰를 쌓아갑니다.' },
  { icon: '🌱', title: '희망', desc: '환자의 회복과 가족의 평안을 위한 희망을 함께 키워갑니다.' },
];

const services = [
  { icon: '🍽️', title: '식사보조', desc: '균형 잡힌 식사를 돕고, 필요한 경우 경관식사도 보조합니다.' },
  { icon: '🚶', title: '활동보조', desc: '보행, 체위변경, 병실 내 이동을 안전하게 도와드립니다.' },
  { icon: '🚿', title: '위생보조', desc: '세면, 목욕, 구강관리 등 청결한 일상을 유지하도록 돕습니다.' },
  { icon: '💊', title: '투약/건강관리', desc: '정해진 시간에 맞춰 투약을 보조하고 건강 상태를 체크합니다.' },
];