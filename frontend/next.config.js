/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Use 'standalone' for SSR/dynamic rendering
  experimental: {
    appDir: true,
  },
  // Optional: for fully static export, you cannot mix client components with generateStaticParams
  // output: 'export',
}

module.exports = nextConfig