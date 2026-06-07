import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getBlogPosts, getBlogPost } from '@/lib/blog';
import AdSense from '@/components/AdSense';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getBlogPost(params.slug);
  if (!post) return { title: '글을 찾을 수 없습니다' };
  return {
    title: `${post.title} - 다사랑 간병 블로그`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
    },
  };
}

export default function BlogPostPage({ params }: Props) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  return (
    <div style={{ minHeight: '100vh', background: '#FEFBF6' }}>
      {/* 헤더 */}
      <section
        style={{
          background: 'linear-gradient(135deg, #4A7C59 0%, #5B8C5A 50%, #8DB580 100%)',
          color: 'white',
          padding: '2.5rem 1rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
          {/* 태그 */}
          {post.tags.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '0.375rem',
                marginBottom: '1rem',
              }}
            >
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
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
          <h1
            style={{
              fontSize: 'clamp(1.25rem, 3.5vw, 2rem)',
              fontWeight: 'bold',
              lineHeight: 1.4,
              marginBottom: '0.75rem',
            }}
          >
            {post.title}
          </h1>
          <p style={{ opacity: 0.75, fontSize: '0.875rem' }}>{post.date}</p>
        </div>
      </section>

      {/* 본문 */}
      <article style={{ maxWidth: '48rem', margin: '0 auto', padding: '3rem 1rem' }}>
        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </article>

      {/* 광고 */}
      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 1rem 2rem' }}>
        <AdSense style={{ margin: '0 auto', maxWidth: '100%' }} />
      </div>

      {/* 하단 네비게이션 */}
      <section
        style={{
          maxWidth: '48rem',
          margin: '0 auto',
          padding: '0 1rem 3rem',
          borderTop: '1px solid #E8D5C4',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingTop: '2rem',
          }}
        >
          <Link
            href="/blog"
            style={{
              color: '#4A7C59',
              fontWeight: 600,
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.75rem',
              border: '2px solid #4A7C59',
              fontSize: '0.9375rem',
            }}
          >
            ← 목록으로
          </Link>
          <Link
            href="/inquiry"
            style={{
              background: '#4A7C59',
              color: 'white',
              fontWeight: 600,
              textDecoration: 'none',
              padding: '0.5rem 1.5rem',
              borderRadius: '0.75rem',
              fontSize: '0.9375rem',
            }}
          >
            💚 간병 상담하기
          </Link>
        </div>
      </section>

      {/* 블로그 콘텐츠 스타일 */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .blog-content {
            color: #3D3929;
            font-size: 1.0625rem;
            line-height: 1.85;
          }
          .blog-content h2 {
            font-size: 1.5rem;
            font-weight: bold;
            color: #4A7C59;
            margin-top: 2.5rem;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #E8F5E9;
          }
          .blog-content h3 {
            font-size: 1.2rem;
            font-weight: bold;
            color: #5B8C5A;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
          }
          .blog-content p {
            margin-bottom: 1rem;
          }
          .blog-content ul, .blog-content ol {
            margin-bottom: 1rem;
            padding-left: 1.5rem;
          }
          .blog-content li {
            margin-bottom: 0.5rem;
            line-height: 1.7;
          }
          .blog-content strong {
            color: #4A7C59;
            font-weight: 700;
          }
          .blog-content blockquote {
            border-left: 4px solid #8DB580;
            padding: 0.75rem 1.25rem;
            margin: 1.25rem 0;
            background: #F0F7F0;
            border-radius: 0 0.75rem 0.75rem 0;
            color: #5B6B5A;
            font-style: italic;
          }
          .blog-content a {
            color: #4A7C59;
            text-decoration: underline;
          }
          .blog-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.25rem 0;
            font-size: 0.9375rem;
          }
          .blog-content th {
            background: #4A7C59;
            color: white;
            padding: 0.75rem 1rem;
            text-align: left;
            font-weight: 600;
          }
          .blog-content td {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid #E8D5C4;
            background: white;
          }
          .blog-content tr:nth-child(even) td {
            background: #FEFBF6;
          }
          .blog-content hr {
            border: none;
            border-top: 1px solid #E8D5C4;
            margin: 2rem 0;
          }
          .blog-content code {
            background: #E8F5E9;
            padding: 0.15rem 0.4rem;
            border-radius: 0.375rem;
            font-size: 0.875em;
            color: #4A7C59;
          }
          .blog-content em {
            color: #6B7280;
          }
          @media (max-width: 640px) {
            .blog-content {
              font-size: 1rem;
            }
            .blog-content h2 {
              font-size: 1.25rem;
            }
            .blog-content table {
              font-size: 0.8125rem;
            }
            .blog-content th, .blog-content td {
              padding: 0.5rem;
            }
          }
        `,
        }}
      />
    </div>
  );
}
