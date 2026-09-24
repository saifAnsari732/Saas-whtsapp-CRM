import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://chatflyr.com';
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard/', '/inbox/', '/settings/', '/admin/'] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
