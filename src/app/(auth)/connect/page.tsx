// src/app/(auth)/connect/page.tsx - Updated with Bags.Fi styling

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { WalletManager } from '@/lib/wallets/adapter';
import { useAuthStore } from '@/store/auth.store';
import { LockIcon } from '@/components/locke/LockIcon/LockIcon';
import { PhantomIcon, SolflareIcon, PolkadotIcon } from '@/components/icons';

export default function LandingPage() {
  const router = useRouter();
  const { setUser, setConnecting, isAuthenticated, user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWallets, setShowWallets] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const walletManager = new WalletManager();

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    router.push('/feed');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e27] via-[#0f1229] to-[#0a0e27]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <LockIcon locked={false} />
        </motion.div>
      </div>
    );
  }

  const handleConnect = async (adapter: 'phantom' | 'solflare') => {
    setError(null);
    setIsConnecting(true);
    setConnecting(true);

    try {
      const connection = await walletManager.connect(adapter);
      
      const existingUser = null;

      if (existingUser) {
        setUser(existingUser);
        router.push('/feed');
      } else {
        router.push(`/onboarding?wallet=${connection.address}&chain=${connection.chain}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
      setConnecting(false);
    }
  };

  const features = [
    {
      icon: "🔐",
      title: "Token-Gated Access",
      description: "Real-time verification of Solana token holdings via Bags API. Access unlocks based on your portfolio.",
      stats: "Real-time verification",
    },
    {
      icon: "💬",
      title: "Exclusive Communities",
      description: "Create and join token-native communities. Content restricted by holdings levels.",
      stats: "10K+ active communities",
    },
    {
      icon: "📊",
      title: "Influence Metrics",
      description: "Global and community leaderboards. Rank by holdings, trading volume, and engagement.",
      stats: "Measurable impact",
    },
    {
      icon: "⚡️",
      title: "Real-time Updates",
      description: "Your access and rank update instantly as your holdings change on-chain.",
      stats: "<100ms updates",
    },
    {
      icon: "🎯",
      title: "Trading Intelligence",
      description: "Monitor bags, track whales, and get market insights from your community.",
      stats: "Solana ecosystem data",
    },
    {
      icon: "🤝",
      title: "Network Effects",
      description: "Build relationships with like-minded token holders and traders.",
      stats: "Community-driven growth",
    },
  ];

  const howItWorks = [
    {
      number: "01",
      title: "Connect Your Wallet",
      description: "Link your Solana wallet (Phantom, Solflare) to get started. Signing is secure and instantaneous.",
      icon: "👛",
    },
    {
      number: "02",
      title: "Verify Your Bags",
      description: "Your token holdings are verified on-chain via Bags API. No trust required, just blockchain.",
      icon: "✓",
    },
    {
      number: "03",
      title: "Access Unlocks",
      description: "Chat rooms, communities, and content unlock based on your holdings and tier.",
      icon: "🔓",
    },
    {
      number: "04",
      title: "Earn Influence",
      description: "Build your rank through holdings and engagement. Influence equals visibility and power.",
      icon: "🏆",
    },
  ];

  const testimonials = [
    {
      name: "Alex Trader",
      role: "Solana Whale",
      quote: "Finally, a platform where my holdings actually grant me access to real insights.",
      avatar: "🐋",
    },
    {
      name: "Sam Dev",
      role: "Community Builder",
      quote: "Built our community in 2 weeks. The token-gating system is seamless.",
      avatar: "👨‍💻",
    },
    {
      name: "Jordan DAO",
      role: "DAO Founder",
      quote: "Perfect for coordinating our token holders. Transparent, secure, immutable.",
      avatar: "🏛",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1229] to-[#0a0e27]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0e27]/80 backdrop-blur-xl border-b border-[rgba(0,255,136,0.1)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2 text-2xl font-bold"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="text-[#00ff88]">⚡️</span>
            <span className="bg-gradient-to-r from-[#00ff88] to-[#00d9ff] bg-clip-text text-transparent">InnerCircle</span>
          </motion.div>
          <motion.button
            onClick={() => router.push('/onboarding')}
            className="px-6 py-2 bg-[#00ff88] text-[#0a0e27] rounded-full font-bold hover:shadow-[0_0_20px_rgba(0,255,136,0.5)] transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Launch App
          </motion.button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
        {/* Animated background elements */}
        <motion.div
          className="absolute top-20 right-10 w-72 h-72 bg-[#7c3aed] rounded-full filter blur-3xl opacity-20"
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-72 h-72 bg-[#00ff88] rounded-full filter blur-3xl opacity-20"
          animate={{ y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-[rgba(0,255,136,0.1)] border border-[rgba(0,255,136,0.3)] text-[#00ff88] text-sm font-mono">
              ✦ Token-Gated Communities
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-6xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Your Bags.
            <br />
            Your Community.
            <br />
            <span className="bg-gradient-to-r from-[#00ff88] via-[#00d9ff] to-[#7c3aed] bg-clip-text text-transparent">
              Your Influence.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            The first truly decentralized SocialFI platform built for Solana token holders. Token-gated chat, exclusive
            communities, and real-time influence metrics powered by Bags API.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {!showWallets ? (
              <>
                <button
                  onClick={() => setShowWallets(true)}
                  className="px-8 py-4 bg-gradient-to-r from-[#00ff88] to-[#00d9ff] text-[#0a0e27] rounded-full font-bold text-lg hover:shadow-[0_0_30px_rgba(0,255,136,0.6)] transition-all"
                >
                  Enter the Community
                </button>
                <button
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 border border-[rgba(0,255,136,0.3)] text-[#00ff88] rounded-full font-bold hover:bg-[rgba(0,255,136,0.1)] transition-all"
                >
                  Learn More
                </button>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="w-full max-w-md"
              >
                <h3 className="text-xl font-semibold mb-4 text-[#f0f4ff]">Choose Your Wallet</h3>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleConnect('phantom')}
                    disabled={isConnecting}
                    className="flex items-center gap-4 px-6 py-4 bg-[rgba(0,255,136,0.15)] border border-[rgba(0,255,136,0.3)] rounded-xl hover:bg-[rgba(0,255,136,0.2)] transition-all"
                  >
                    <PhantomIcon />
                    <span className="text-lg font-semibold">Phantom</span>
                  </button>
                  <button
                    onClick={() => handleConnect('solflare')}
                    disabled={isConnecting}
                    className="flex items-center gap-4 px-6 py-4 bg-[rgba(15,18,41,0.8)] border border-[rgba(0,255,136,0.1)] rounded-xl hover:border-[rgba(0,255,136,0.3)] transition-all"
                  >
                    <SolflareIcon />
                    <span className="text-lg font-semibold">Solflare</span>
                  </button>
                </div>
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-3 bg-[rgba(255,51,51,0.1)] border border-[rgba(255,51,51,0.3)] rounded-lg text-sm text-[#ff3333]"
                  >
                    {error}
                  </motion.div>
                )}
                <button
                  onClick={() => setShowWallets(false)}
                  className="mt-4 text-sm text-[#a8adc7] hover:text-[#f0f4ff] transition-colors"
                >
                  ← Back
                </button>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-12 flex justify-center gap-8 text-sm"
          >
            <div>
              <div className="text-[#00ff88] font-bold text-2xl">50K+</div>
              <div className="text-gray-400">Active Users</div>
            </div>
            <div>
              <div className="text-[#00d9ff] font-bold text-2xl">1B+</div>
              <div className="text-gray-400">Assets Gated</div>
            </div>
            <div>
              <div className="text-[#7c3aed] font-bold text-2xl">100%</div>
              <div className="text-gray-400">On-Chain</div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-gray-400 text-sm"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div>Scroll to explore</div>
          <div className="text-[#00ff88] text-2xl">↓</div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold mb-4">
              Built for{" "}
              <span className="bg-gradient-to-r from-[#00ff88] to-[#00d9ff] bg-clip-text text-transparent">
                Token Holders
              </span>
            </h2>
            <p className="text-xl text-gray-400">Everything you need to build, govern, and grow your token community</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group p-6 bg-[#0f1229]/50 border border-[rgba(0,255,136,0.1)] rounded-2xl hover:border-[rgba(0,255,136,0.3)] hover:bg-[#0f1229]/80 transition-all cursor-pointer"
                onMouseEnter={() => setActiveFeature(idx)}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-[#00ff88] transition-colors">{feature.title}</h3>
                <p className="text-gray-400 mb-4">{feature.description}</p>
                <div className="text-sm text-[#00ff88] font-mono">{feature.stats}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-[#0f1229]/30 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#00ff88] to-[#00d9ff] bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-xl text-gray-400">Four simple steps to unlock your community</p>
          </motion.div>

          <div className="space-y-8">
            {howItWorks.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-6 items-center group"
              >
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#00ff88] to-[#00d9ff] flex items-center justify-center text-3xl font-bold text-[#0a0e27] group-hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] transition-all">
                    {step.number}
                  </div>
                </div>
                <div className="flex-1 p-6 bg-[#0f1229]/50 border border-[rgba(0,255,136,0.1)] rounded-2xl group-hover:border-[rgba(0,255,136,0.3)] group-hover:bg-[#0f1229]/80 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold">{step.title}</h3>
                    <span className="text-3xl">{step.icon}</span>
                  </div>
                  <p className="text-gray-400">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(0,255,136,0.1)] py-12 px-6">
        <div className="max-w-6xl mx-auto text-center text-gray-400 text-sm">
          <p>© 2025 InnerCircle. All rights reserved. Powered by Bags API on Solana.</p>
        </div>
      </footer>
    </div>
  );
}