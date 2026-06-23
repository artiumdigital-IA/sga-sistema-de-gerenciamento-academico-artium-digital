/** @type {import('next').NextConfig} */
const nextConfig = {
  // PWA: configurar next-pwa quando o shell estiver estável
  // por ora mantemos simples
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
