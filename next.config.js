/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
      // Handle node: protocol imports
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          buffer: require.resolve('buffer/'),
          crypto: require.resolve('crypto-browserify'),
          stream: require.resolve('stream-browserify'),
          assert: require.resolve('assert/'),
          http: require.resolve('stream-http'),
          https: require.resolve('https-browserify'),
          os: require.resolve('os-browserify/browser'),
          url: require.resolve('url/'),
        };
      }
      
      return config;
    },
  };
  
  module.exports = nextConfig;