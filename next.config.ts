// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Opción A: lista simple de dominios
    domains: ['twdcptekyongdzdonslv.supabase.co'],

    // Opción B: patrón remoto (más flexible)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'twdcptekyongdzdonslv.supabase.co',
        pathname: '/storage/v1/object/public/**', // tus buckets públicos
      },
    ],
  },
};

module.exports = nextConfig;
