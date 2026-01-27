// File: src/components/providers/Providers.tsx
// ============================================================================
// Client-side providers wrapper with animation support
// ============================================================================

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from '@/contexts/ThemeContext';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// Simple error boundary as a functional component wrapper
function ErrorFallback({ error, onReset }: { error?: Error; onReset: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
        background: '#0a0a0f',
        color: '#ffffff',
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong</h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', maxWidth: '400px' }}>
        {error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
      </p>
      <button
        onClick={onReset}
        style={{
          padding: '0.75rem 1.5rem',
          background: '#8b5cf6',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 600,
        }}
      >
        Try Again
      </button>
    </div>
  );
}

// Error boundary class component
class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  // ThemeProvider handles its own mounting state internally
  // AnimatePresence is safe to render on both server and client
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
