import Link from 'next/link';
import type { Metadata } from 'next';
import { getBlogPosts, isNewPost } from '@/lib/blog';

export const metadata: Metadata = {
  title: '간병 정보 블로그 - 다사랑 간병',
  description: '간병에 관한 유용한 정보와 팁을 제공합니다. 장기요양보험, 간병인 선택, 복지 서비스 가이드.',
};

const TAG_COLORS: Record<string, string> = {
  장기요양보험: '#4A7C59',
  등급판정: '#5B8C5A',
  신청방법: '#6B9B5A',
  복지정보: '#8DB580',
  가족간병: '#E65100',
  전문간병인: '#F57C00',
  간병비교: '#FF9800',
  간병가이드: '#4A7C59',
};

export default function BlogPage() {
  const posts = getBlogPosts();

  return (
    <div style={{ minHeight: '100vh', background: '#FEFBF6' }}>
      {/* 헤더 */}
      <section
        style={{
          background: 'linear-gradient(135deg, #4A7C59 0%, #5B8C5A 50%, #8DB580 100%)',
          color: 'white',
          padding: '3rem 1rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            📝 간병 정보 블로그
          </h1>
          <p style={{ opacity: 0.85, fontSize: 'clamp(0.9375rem, 1.5vw, 1.125rem)', lineHeight: 1.7 }}>
            간병에 관한 유용한 정보와 팁을 전해드립니다
          </p>
        </div>
      </section>

      {/* 포스트 목록 */}
      <section style={{ maxWidth: '72rem', margin: '0 auto', padding: '3rem 1rem' }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#6B7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <p style={{ fontSize: '1.125rem' }}>아직 등록된 글이 없습니다.</p>
            <p>곧 유용한 정보로 찾아뵙겠습니다!</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                style={{
                  background: 'white',
                  borderRadius: '1.25rem',
                  padding: '2rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  boxShadow: '0 2px 12px rgba(139, 119, 90, 0.08)',
                  border: '1px solid #F0E8D8',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative',
                }}
              >
                {/* NEW 배지 */}
                {isNewPost(post.date) && (
                  <span style={{
                    position: 'absolute', top: '0.75rem', right: '0.75rem',
                    background: '#E65100', color: 'white',
                    padding: '0.2rem 0.5rem', borderRadius: '0.5rem',
                    fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.05em',
                  }}>NEW</span>
                )}
                {/* 태그 */}
                {post.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          background: TAG_COLORS[tag] || '#6B7280',
                          color: 'white',
                          padding: '0.2rem 0.625rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <h2
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#3D3929',
                    lineHeight: 1.4,
                  }}
                >
                  {post.title}
                </h2>

                <p
                  style={{
                    color: '#6B7280',
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    flex: 1,
                  }}
                >
                  {post.excerpt}
                </p>

                <div
                  style={{
                    borderTop: '1px solid #F0E8D8',
                    paddingTop: '0.75rem',
                    fontSize: '0.8125rem',
                    color: '#9CA3AF',
                  }}
                >
                  {post.date}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section style={{ padding: '3rem 0', background: 'white' }}>
        <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1rem', textAlign: 'center' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #4A7C59 0%, #5B8C5A 50%, #8DB580 100%)',
              borderRadius: '1.5rem',
              padding: '3rem 2rem',
              color: 'white',
            }}
          >
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 'bold', marginBottom: '1rem' }}>
              💚 도움이 필요하신가요?
            </h2>
            <p style={{ opacity: 0.85, fontSize: '1.125rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              간병인 상담부터 장기요양보험 신청까지<br />다사랑 간병이 함께 도와드립니다
            </p>
            <Link
              href="/inquiry"
              style={{
                display: 'inline-block',
                background: 'white',
                color: '#4A7C59',
                padding: '0.875rem 2rem',
                borderRadius: '1rem',
                fontWeight: 'bold',
                fontSize: '1rem',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              무료 상담 신청하기 →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
