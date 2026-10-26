/** @type {import('next').NextConfig} */
const supabaseStorageHostname = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_PUBLIC_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_STORAGE_PUBLIC_URL).hostname
  : '*.supabase.co';

const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['pg'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: supabaseStorageHostname, pathname: '/storage/v1/object/public/**' },
      // LEGACY R2 / AWS S3 remote patterns intentionally disabled after storage migration:
      // { protocol: 'https', hostname: '*.s3.amazonaws.com' },
      // { protocol: 'https', hostname: '*.s3.*.amazonaws.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

export default nextConfig;
