import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark server-side only modules as external for the server build
      config.externals = [...(config.externals || []), 'express', 'require-in-the-middle', 'import-in-the-middle', 'jsdom'];
    } else {
      // Prevent server-only modules from being bundled for the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        express: false,
        'require-in-the-middle': false,
        'import-in-the-middle': false,
        jsdom: false,
        fs: false,
        net: false,
        tls: false,
        path: false,
        child_process: false,
        os: false,
        http: false,
        https: false,
        stream: false,
        zlib: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
