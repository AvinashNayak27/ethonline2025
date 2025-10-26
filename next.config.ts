/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer'),
        global: require.resolve('global'),
        process: require.resolve('process/browser'),
      };
    }
    return config;
  },
  turbopack: {},
}

module.exports = nextConfig
