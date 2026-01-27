// File: src/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import './globals.scss';
import '@/styles/themes.scss';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'InnerCircle - Access is earned.',
  description: 'Token-gated social platform where access to communities, private posts, and influence is determined by on-chain memecoin ownership.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
