import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const BLOG_DIR = path.join(process.cwd(), 'content/blog');

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  contentHtml: string;
}

/**
 * date 기준 최신순으로 모든 블로그 포스트를 반환합니다.
 * (콘텐츠 HTML은 제외 — 목록용)
 */
export function getBlogPosts(): Omit<BlogPost, 'contentHtml'>[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
  const posts = files.map((file) => {
    const slug = file.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
    const { data } = matter(raw);
    return {
      slug,
      title: data.title || slug,
      date: data.date || '',
      excerpt: data.excerpt || '',
      tags: data.tags || [],
    };
  });

  return posts.sort((a, b) => (a.date > b.date ? -1 : 1));
}

/**
 * slug로 특정 포스트를 가져옵니다 (HTML 변환 포함).
 */
export function getBlogPost(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  const contentHtml = marked(content, { breaks: true }) as string;

  return {
    slug,
    title: data.title || slug,
    date: data.date || '',
    excerpt: data.excerpt || '',
    tags: data.tags || [],
    contentHtml,
  };
}
