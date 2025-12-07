import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.tosspayments.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
      "media-src 'self' blob: https://*.supabase.co https://*.supabase.in",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.tosspayments.com https://api.klingai.com",
      "frame-src 'self' https://js.tosspayments.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join('; ')
  }
];

const nextConfig: NextConfig = {
  // 보안 헤더 설정
  async headers() {
    return [
      {
        // 모든 라우트에 보안 헤더 적용
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // 프로덕션 빌드 최적화
  poweredByHeader: false, // X-Powered-By 헤더 제거

  // 압축 활성화
  compress: true,

  // React Strict Mode
  reactStrictMode: true,

  // 실험적 기능
  experimental: {
    // 서버 액션 최적화
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
