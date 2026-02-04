// File: src/app/not-found.tsx
// ============================================================================
// Custom 404 Page - Redirects to appropriate pages
// ============================================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button/Button';
import { LockIcon } from '@/components/locke/LockIcon/LockIcon';

export default function NotFound() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect based on auth status
          if (isAuthenticated) {
            router.push('/feed');
          } else {
            router.push('/connect');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, router]);

  const handleGoHome = () => {
    if (isAuthenticated) {
      router.push('/feed');
    } else {
      router.push('/connect');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000f08 0%, #0a1a12 50%, #000f08 100%)',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        >
          <LockIcon locked={true} size="lg" />
        </motion.div>

        <h1 style={{
          fontSize: '3rem',
          fontWeight: 700,
          color: '#daffed',
          margin: 0,
        }}>
          404
        </h1>

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 500,
          color: 'rgba(218, 255, 237, 0.8)',
          margin: 0,
        }}>
          Page Not Found
        </h2>

        <p style={{
          fontSize: '1rem',
          color: 'rgba(218, 255, 237, 0.6)',
          maxWidth: '400px',
          lineHeight: 1.6,
        }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          You&apos;ll be redirected in {countdown} seconds.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Button variant="primary" onClick={handleGoHome}>
            Go to {isAuthenticated ? 'Feed' : 'Connect'}
          </Button>
          <Button variant="ghost" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'rgba(218, 255, 237, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(218, 255, 237, 0.1)',
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: 'rgba(218, 255, 237, 0.5)',
            margin: 0,
          }}>
            Looking for something specific?
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginTop: '0.75rem',
            justifyContent: 'center',
          }}>
            {[
              { href: '/feed', label: 'Feed' },
              { href: '/communities', label: 'Communities' },
              { href: '/intelligence', label: 'Intelligence' },
              { href: '/leaderboards', label: 'Leaderboards' },
              { href: '/search', label: 'Search' },
            ].map((link) => (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(218, 255, 237, 0.1)',
                  border: '1px solid rgba(218, 255, 237, 0.2)',
                  borderRadius: '8px',
                  color: '#daffed',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(218, 255, 237, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(218, 255, 237, 0.1)';
                }}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
