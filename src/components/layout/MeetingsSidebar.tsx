/**
 * Sidebar navigation for the authenticated meetings workspace.
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MEETINGS_NAV_ITEMS } from '@/constants/meetings-nav';
import styles from './meetings-shell.module.css';

/**
 * Renders the meetings section navigation.
 */
export function MeetingsSidebar() {
    const pathname = usePathname();

    return (
        <aside className={styles.sidebar} aria-label="Meetings navigation">
            <nav className={styles.sidebarNav}>
                {MEETINGS_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active =
                        pathname === item.href ||
                        (item.href !== '/home' && pathname.startsWith(`${item.href}/`));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                            title={item.description}
                            aria-current={active ? 'page' : undefined}
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
