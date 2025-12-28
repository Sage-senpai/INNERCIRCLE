// File: src/components/navigation/MobileNav/MobileNav.tsx
// ============================================================================

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FeedIcon, 
  CommunitiesIcon, 
  SearchIcon,
  ProfileIcon 
} from '@/components/icons';
import { useAuthStore } from '@/store/auth.store';
import styles from './MobileNav.module.scss';

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const navItems = [
    { href: '/feed', icon: FeedIcon, label: 'Feed' },
    { href: '/communities', icon: CommunitiesIcon, label: 'Communities' },
    { href: '/search', icon: SearchIcon, label: 'Search' },
    { href: `/profile/${user?.username}`, icon: ProfileIcon, label: 'Profile' },
  ];

  return (
    <motion.nav 
      className={styles.mobile_nav}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.mobile_nav__link} ${isActive ? styles['mobile_nav__link--active'] : ''}`}
          >
            <Icon className={styles.mobile_nav__icon} />
            <span className={styles.mobile_nav__label}>{item.label}</span>
            {isActive && (
              <motion.div
                className={styles.mobile_nav__indicator}
                layoutId="mobileActiveIndicator"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </motion.nav>
  );
}