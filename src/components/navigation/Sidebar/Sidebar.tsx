// File: src/components/navigation/Sidebar/Sidebar.tsx (ENHANCED)
// ============================================================================

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import { 
  FeedIcon, 
  CommunitiesIcon, 
  IntelligenceIcon, 
  LeaderboardIcon,
  SearchIcon,
  TransmissionsIcon,
  ProfileIcon,
  SettingsIcon 
} from '@/components/icons';
import { LockIcon } from '@/components/locke/LockIcon/LockIcon';
import styles from './Sidebar.module.scss';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const navSections = [
    {
      title: 'Main',
      items: [
        { href: '/feed', icon: FeedIcon, label: 'Feed' },
        { href: '/communities', icon: CommunitiesIcon, label: 'Communities' },
        { href: '/intelligence', icon: IntelligenceIcon, label: 'Intelligence' },
      ]
    },
    {
      title: 'Discover',
      items: [
        { href: '/leaderboards', icon: LeaderboardIcon, label: 'Leaderboards' },
        { href: '/search', icon: SearchIcon, label: 'Search' },
      ]
    },
    {
      title: 'Social',
      items: [
        { href: '/transmissions', icon: TransmissionsIcon, label: 'Transmissions' },
      ]
    }
  ];

  const bottomItems = [
    { href: `/profile/${user?.username}`, icon: ProfileIcon, label: 'Profile' },
    { href: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <motion.aside 
      className={styles.sidebar}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className={styles.sidebar__header}>
        <Link href="/feed" className={styles.sidebar__logo}>
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <LockIcon className={styles.sidebar__logo_icon} locked={false} />
          </motion.div>
          <div className={styles.sidebar__logo_text_wrapper}>
            <span className={styles.sidebar__logo_text}>InnerCircle</span>
            <span className={styles.sidebar__tagline}>Access is earned</span>
          </div>
        </Link>
      </div>

      <nav className={styles.sidebar__nav}>
        {navSections.map((section, sectionIdx) => (
          <div key={section.title} className={styles.sidebar__section}>
            <h3 className={styles.sidebar__section_title}>{section.title}</h3>
            <ul className={styles.sidebar__list}>
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <motion.li 
                    key={item.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (sectionIdx * 0.1) + (itemIdx * 0.05) }}
                  >
                    <Link 
                      href={item.href}
                      className={`${styles.sidebar__link} ${isActive ? styles['sidebar__link--active'] : ''}`}
                    >
                      <Icon className={styles.sidebar__icon} />
                      <span className={styles.sidebar__label}>{item.label}</span>
                      {isActive && (
                        <motion.div 
                          className={styles.sidebar__indicator}
                          layoutId="activeIndicator"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={styles.sidebar__footer}>
        <ul className={styles.sidebar__list}>
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={`${styles.sidebar__link} ${isActive ? styles['sidebar__link--active'] : ''}`}
                >
                  <Icon className={styles.sidebar__icon} />
                  <span className={styles.sidebar__label}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {user && (
          <motion.div 
            className={styles.sidebar__user}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className={styles.sidebar__user_avatar}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className={styles.sidebar__user_info}>
              <div className={styles.sidebar__user_name}>@{user.username}</div>
              <div className={styles.sidebar__user_wallet}>
                {user.walletAddress.slice(0, 4)}...{user.walletAddress.slice(-4)}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.aside>
  );
}