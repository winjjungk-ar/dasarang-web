import { marked } from 'marked';
import blogPosts from '@/lib/blog-posts';
import type { BlogPostData } from '@/lib/blog-posts';

export type { BlogPostData };

export interface BlogPost extends BlogPostData {
  contentHtml: string;
}

/**
 * 모든 블로그 포스트를 date 기준 최신순으로 반환합니다 (HTML 제외 — 목록용).
 */
export function getBlogPosts(): Omit<BlogPost, 'contentHtml'>[] {
  return [...blogPosts].sort((a, b) => (a.date > b.date ? -1 : 1));
}

/**
 * slug로 특정 포스트를 가져옵니다 (HTML 변환 포함).
 */
export function getBlogPost(slug: string): BlogPost | null {
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return null;

  const contentHtml = marked(post.markdown, { breaks: true }) as string;

  return { ...post, contentHtml };
}
