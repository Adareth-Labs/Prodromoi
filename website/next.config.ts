import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  allowedDevOrigins: ['192.168.0.116'],

  // Image optimisation — updated from legacy CMS data/S3 to Cloudflare R2
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.dev',           // R2 public bucket default domain
      },
      {
        protocol: 'https',
        hostname: 'media.precisioncore.com', // custom R2 domain (set up in R2 dashboard)
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Security headers applied to every response
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security',  value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              "font-src 'self' fonts.gstatic.com",
              "img-src 'self' data: *.r2.dev media.precisioncore.com",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },

  async redirects() {
    return [
      { source: '/about', destination: '/company',  permanent: true },
      { source: '/press', destination: '/newsroom', permanent: true },
    ]
  },

  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://precisioncore.com',
  },
}

export default withPayload(nextConfig)
