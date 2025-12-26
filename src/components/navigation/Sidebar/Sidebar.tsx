// File: src/components/navigation/Sidebar/Sidebar.tsx

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
import styles from './Sidebar.module.scss';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { href: '/feed', icon: FeedIcon, label: 'Feed' },
    { href: '/communities', icon: CommunitiesIcon, label: 'Communities' },
    { href: '/intelligence', icon: IntelligenceIcon, label: 'Intelligence' },
    { href: '/leaderboards', icon: LeaderboardIcon, label: 'Leaderboards' },
    { href: '/search', icon: SearchIcon, label: 'Search' },
    { href: '/transmissions', icon: TransmissionsIcon, label: 'Transmissions' },
  ];

  const bottomItems = [
    { href: `/profile/${user?.username}`, icon: ProfileIcon, label: 'Profile' },
    { href: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <motion.aside 
      className={`${styles.sidebar} ${isCollapsed ? styles['sidebar--collapsed'] : ''}`}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.sidebar__header}>
        <div className={styles.sidebar__logo}>
          <span className={styles.sidebar__logo_text}>InnerCircle</span>
        </div>
      </div>

      <nav className={styles.sidebar__nav}>
        <ul className={styles.sidebar__list}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={`${styles.sidebar__link} ${isActive ? styles['sidebar__link--active'] : ''}`}
                >
                  <Icon className={styles.sidebar__icon} />
                  {!isCollapsed && (
                    <span className={styles.sidebar__label}>{item.label}</span>
                  )}
                  {isActive && (
                    <motion.div 
                      className={styles.sidebar__indicator}
                      layoutId="activeIndicator"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
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
                  {!isCollapsed && (
                    <span className={styles.sidebar__label}>{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.aside>
  );
}