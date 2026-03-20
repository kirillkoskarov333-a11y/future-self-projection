/** @type {import('next').NextConfig} */
const nextConfig = {
  // No "standalone" output — PWA builds as regular Next.js app for Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
