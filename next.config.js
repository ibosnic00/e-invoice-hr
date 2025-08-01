/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Fix asset paths for GitHub Pages deployment
  assetPrefix: process.env.NODE_ENV === 'production' ? '/e-invoice/' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/e-invoice' : '',
}

module.exports = nextConfig 