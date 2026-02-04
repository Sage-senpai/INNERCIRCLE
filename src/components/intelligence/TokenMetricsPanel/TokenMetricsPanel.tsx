// File: src/components/intelligence/TokenMetricsPanel/TokenMetricsPanel.tsx
// ============================================================================

'use client';

import { motion } from 'framer-motion';
import { useIntelligenceStore } from '@/store/intelligence.store';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner/LoadingSpinner';
import { TrendUpIcon, TrendDownIcon } from '@/components/icons';
import styles from './TokenMetricsPanel.module.scss';

export function TokenMetricsPanel() {
  const { selectedTokenMetrics, tokenMetricsLoading } = useIntelligenceStore();

  if (tokenMetricsLoading) {
    return (
      <div className={styles.panel__loading}>
        <LoadingSpinner size="lg" variant="lock" />
        <p>Loading token metrics...</p>
      </div>
    );
  }

  if (!selectedTokenMetrics) {
    return (
      <div className={styles.panel__empty}>
        <span className={styles.panel__empty_icon}>📊</span>
        <p>Select a token to view detailed metrics</p>
      </div>
    );
  }

  const metrics = selectedTokenMetrics;
  const priceChangePositive = metrics.priceChange24h >= 0;

  return (
    <motion.div
      className={styles.panel}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className={styles.panel__header}>
        <div className={styles.panel__token}>
          <h2 className={styles.panel__token_symbol}>{metrics.symbol}</h2>
          <p className={styles.panel__token_name}>{metrics.name}</p>
        </div>
        <div className={styles.panel__price}>
          <div className={styles.panel__price_value}>
            ${metrics.priceUsd.toFixed(6)}
          </div>
          <div className={`${styles.panel__price_change} ${priceChangePositive ? styles['panel__price_change--up'] : styles['panel__price_change--down']}`}>
            {priceChangePositive ? <TrendUpIcon /> : <TrendDownIcon />}
            {priceChangePositive ? '+' : ''}{metrics.priceChange24h.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className={styles.metrics}>
        <MetricCard
          label="Market Cap"
          value={formatLargeNumber(metrics.marketCap)}
          icon="💰"
        />
        <MetricCard
          label="24h Volume"
          value={formatLargeNumber(metrics.volume24h)}
          icon="📈"
        />
        <MetricCard
          label="Liquidity"
          value={formatLargeNumber(metrics.liquidity)}
          icon="💧"
        />
        <MetricCard
          label="6h Change"
          value={`${metrics.priceChange6h >= 0 ? '+' : ''}${metrics.priceChange6h.toFixed(2)}%`}
          icon={metrics.priceChange6h >= 0 ? '📈' : '📉'}
          trend={metrics.priceChange6h >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          label="1h Change"
          value={`${metrics.priceChange1h >= 0 ? '+' : ''}${metrics.priceChange1h.toFixed(2)}%`}
          icon={metrics.priceChange1h >= 0 ? '📈' : '📉'}
          trend={metrics.priceChange1h >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          label="FDV"
          value={formatLargeNumber(metrics.fdv)}
          icon="💎"
        />
      </div>

      {/* Additional Info */}
      <div className={styles.panel__footer}>
        <div className={styles.panel__chain}>
          <span className={styles.panel__chain_label}>Chain:</span>
          <span className={styles.panel__chain_value}>{metrics.chain.toUpperCase()}</span>
        </div>
        <div className={styles.panel__updated}>
          Updated: {new Date(metrics.fetchedAt).toLocaleString()}
        </div>
      </div>
    </motion.div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: string;
  trend?: 'up' | 'down';
}

function MetricCard({ label, value, icon, trend }: MetricCardProps) {
  return (
    <motion.div
      className={styles.metric}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className={styles.metric__icon}>{icon}</div>
      <div className={styles.metric__content}>
        <div className={styles.metric__label}>{label}</div>
        <div className={`${styles.metric__value} ${trend ? styles[`metric__value--${trend}`] : ''}`}>
          {value}
        </div>
      </div>
    </motion.div>
  );
}

function formatLargeNumber(num: number): string {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}
