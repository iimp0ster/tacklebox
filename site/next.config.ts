import type { NextConfig } from 'next';

const basePath = (process.env.NEXT_PUBLIC_SITE_BASE_PATH ?? '').replace(/\/$/, '');

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
};

export default nextConfig;
