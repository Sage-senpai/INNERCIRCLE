import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  reactCompiler: true,
  
  // SCSS configuration with proper path resolution
  sassOptions: {
    includePaths: [path.join(process.cwd(), 'src', 'styles')],
    additionalData: `@use "sass:math";`,
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
   env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_BAGS_API_URL: process.env.NEXT_PUBLIC_BAGS_API_URL,
  },
};

export default nextConfig;
