import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/erp/', '/admin/', '/api/', '/checkin', '/documents/'],
      },
      {
        userAgent: 'NaverBot',
        allow: '/',
        disallow: ['/erp/', '/admin/', '/api/'],
      },
      {
        userAgent: 'Yeti',
        allow: '/',
        disallow: ['/erp/', '/admin/', '/api/'],
      },
    ],
    sitemap: 'https://www.dasarangcare.co.kr/sitemap.xml',
  }
}
