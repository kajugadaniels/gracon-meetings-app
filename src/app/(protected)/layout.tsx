/**
 * Protected layout for app/meetings.
 *
 * It validates the shared Gracon session before rendering meeting surfaces and
 * preserves the local-development login flow used by app/documents.
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { MEETINGS_NAV_ITEMS } from '@/constants/meetings-nav';
import { fetchCurrentUser, logoutFromMeetings, redirectToLogin } from '@/lib/session';
import styles from './layout.module.css';

export interface SessionUser {
    userId: string;
    email: string;
    phoneNumber: string | null;
    imageUrl: string | null;
    surName: string;
    postNames: string;
    sex: string;
    isIdVerified: boolean;
    idVerifiedAt: string | null;
    createdAt: string;
}

const UserContext = createContext<SessionUser | null>(null);

/**
 * Returns the authenticated meetings user from context.
 */
export function useSessionUser() {
    return useContext(UserContext);
}

function isSessionUser(value: unknown): value is SessionUser {
    if (!value || typeof value !== 'object') return false;

    const candidate = value as Record<string, unknown>;

    return (
        typeof candidate.userId === 'string'
        && typeof candidate.email === 'string'
        && typeof candidate.surName === 'string'
        && typeof candidate.postNames === 'string'
        && typeof candidate.sex === 'string'
        && typeof candidate.isIdVerified === 'boolean'
        && typeof candidate.createdAt === 'string'
        && (typeof candidate.phoneNumber === 'string' || candidate.phoneNumber === null)
        && (typeof candidate.imageUrl === 'string' || candidate.imageUrl === null)
        && (typeof candidate.idVerifiedAt === 'string' || candidate.idVerifiedAt === null)
    );
}

function getDisplayName(user: SessionUser) {
    return `${user.postNames} ${user.surName}`.trim() || user.email;
}

function getInitials(user: SessionUser) {
    const fullName = getDisplayName(user);
    return fullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'G';
}

/**
 * Renders the authenticated meetings shell.
 */
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [user, setUser] = useState<SessionUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const [retryKey, setRetryKey] = useState(0);
    const [accountOpen, setAccountOpen] = useState(false);
    const accountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let ignore = false;

        fetchCurrentUser().then((result) => {
            if (ignore) return;

            if (result.status === 'authenticated') {
                if (!isSessionUser(result.user)) {
                    setSessionError('The authentication service returned an unexpected user profile.');
                    setLoading(false);
                    return;
                }

                setUser(result.user);
                setLoading(false);
                return;
            }

            setUser(null);

            if (result.status === 'unauthenticated') {
                const intendedPath =
                    `${window.location.pathname}${window.location.search}${window.location.hash}`;
                redirectToLogin(intendedPath);
                return;
            }

            setSessionError(result.message);
            setLoading(false);
        });

        return () => {
            ignore = true;
        };
    }, [retryKey]);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (!accountRef.current?.contains(event.target as Node)) {
                setAccountOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, []);

    if (loading) {
        return (
            <div className={styles.loadingShell}>
                <div className={styles.loadingCard}>
                    <div className={styles.loadingIcon} aria-hidden="true" />
                    <p className={styles.stateTitle}>Opening meetings workspace...</p>
                    <p className={styles.stateCopy}>Checking your secure Gracon session</p>
                </div>
            </div>
        );
    }

    if (sessionError) {
        return (
            <div className={styles.errorShell}>
                <div className={styles.errorCard}>
                    <p className={styles.stateTitle}>Unable to restore your session</p>
                    <p className={styles.stateCopy}>{sessionError}</p>
                    <div className={styles.errorActions}>
                        <button
                            className={styles.primaryAction}
                            onClick={() => {
                                setLoading(true);
                                setSessionError(null);
                                setRetryKey((value) => value + 1);
                            }}
                        >
                            Try again
                        </button>
                        <button
                            className={styles.ghostAction}
                            onClick={() => {
                                const intendedPath =
                                    `${window.location.pathname}${window.location.search}${window.location.hash}`;
                                redirectToLogin(intendedPath);
                            }}
                        >
                            Sign in again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <UserContext.Provider value={user}>
            <div className={styles.shell}>
                <header className={styles.topbar}>
                    <Link href="/home" className={styles.logo} aria-label="Gracon meetings home">
                        <span className={styles.logoMark}>G</span>
                        <span className={styles.logoText}>
                            <span>Gracon 360</span>
                            <strong>Meetings</strong>
                        </span>
                    </Link>

                    <div ref={accountRef} className={styles.account}>
                        <button
                            type="button"
                            className={styles.avatarButton}
                            onClick={() => setAccountOpen((open) => !open)}
                            aria-label="Open account menu"
                            aria-expanded={accountOpen}
                            aria-haspopup="menu"
                            title={getDisplayName(user)}
                        >
                            {user.imageUrl ? (
                                <Image
                                    src={user.imageUrl}
                                    alt=""
                                    width={38}
                                    height={38}
                                    unoptimized
                                    className={styles.avatarImage}
                                />
                            ) : (
                                <span className={styles.avatarInitials}>{getInitials(user)}</span>
                            )}
                        </button>

                        {accountOpen && (
                            <div className={styles.accountMenu} role="menu">
                                <div className={styles.accountProfile}>
                                    <div className={styles.accountAvatar} aria-hidden="true">
                                        {user.imageUrl ? (
                                            <Image
                                                src={user.imageUrl}
                                                alt=""
                                                width={36}
                                                height={36}
                                                unoptimized
                                            />
                                        ) : (
                                            <span>{getInitials(user)}</span>
                                        )}
                                    </div>
                                    <div className={styles.accountCopy}>
                                        <p>{getDisplayName(user)}</p>
                                        <span>{user.email}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className={styles.accountItem}
                                    onClick={() => void logoutFromMeetings()}
                                    role="menuitem"
                                >
                                    <LogOut size={15} />
                                    <span>Sign out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </header>

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

                <main className={styles.main}>{children}</main>
            </div>
        </UserContext.Provider>
    );
}
