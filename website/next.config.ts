import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

const supabaseStorageHostname = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_PUBLIC_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_PUBLIC_URL).hostname
  : '*.supabase.co'
const apiOrigin = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3002').origin }
  catch { return 'http://localhost:3002' }
})()
const allowedDevOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Set NEXT_ALLOWED_DEV_ORIGINS to a comma-separated list only when LAN
  // development is needed; don't bake a developer's private IP into source.
  allowedDevOrigins,

  // Image optimization allows the active Supabase Storage public-object URL.
  // LEGACY R2 hosts (`*.r2.dev`, `media.precisioncore.com`) are intentionally disabled;
  // the previous remotePatterns are preserved in this comment for rollback reference.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseStorageHostname,
        pathname: '/storage/v1/object/public/**',
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
              "img-src 'self' data: *.supabase.co",
              "connect-src 'self' " + apiOrigin + " https://*.supabase.co https://*.storage.supabase.co",
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
