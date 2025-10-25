/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: 'dist',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true
  },
  assetPrefix: '',
  experimental: {
    esmExternals: false
  },
  webpack: (config, { dev, isServer }) => {
    // Exclude pptxgenjs from server-side bundle
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push('pptxgenjs')
    }
    
    // Development optimizations
    if (dev && !isServer) {
      // Reduce file watching overhead
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/dist', '**/.next']
      }
    }
    
    return config
  }
}

export default nextConfig
