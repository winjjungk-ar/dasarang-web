import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import blogPosts from '@/lib/blog-posts';
import type { BlogPostData } from '@/lib/blog-posts';

export type { BlogPostData };

export interface BlogPost extends BlogPostData {
  contentHtml: string;
}

/** 7일 이내 글이면 true */
export function isNewPost(date: string): boolean {
  const postDate = new Date(date);
  const now = new Date();
  const diff = now.getTime() - postDate.getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
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

  const rawHtml = marked(post.markdown, { breaks: true }) as string;
  const contentHtml = sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'title', 'width', 'height'],
      a: ['href', 'target', 'rel'],
    },
  });

  return { ...post, contentHtml };
}
