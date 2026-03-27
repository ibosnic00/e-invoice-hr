/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  reactStrictMode: false,
  webpack: (config, { webpack, isServer }) => {
    // pdfjs-dist optionally requires the 'canvas' Node.js package for server-side use.
    // We only use it in the browser, so tell webpack to ignore it.
    config.resolve.alias.canvas = false
    // jsPDF dynamically imports 'canvg' for SVG rendering (not used in this project).
    // Ignoring it prevents webpack from bundling the large canvg chunk.
    config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^canvg$/ }))

    // Webpack's module concatenation (scope hoisting) uses JSON.parse internally and
    // fails on Node.js 23 due to a bug in webpack 5's ConcatenationScope.matchModuleReference.
    // Disabling it fixes the build at a minor bundle-size cost.
    config.optimization.concatenateModules = false

    return config
  },
}

module.exports = nextConfig