import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.APP_URL || 'https://promptpolish.com'
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/result/', '/share/', '/api/', '/history/', '/admin/', '/account/'],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  }
}
