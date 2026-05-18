/**
 * Protected layout for app/meetings.
 *
 * It validates the shared Gracon session before rendering meeting surfaces and
 * preserves the local-development login flow used by app/documents.
 */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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

/**
 * Renders the authenticated meetings shell.
 */
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<SessionUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const [retryKey, setRetryKey] = useState(0);

    useEffect(() => {
        let ignore = false;

        setLoading(true);
        setSessionError(null);

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
                            onClick={() => setRetryKey((value) => value + 1)}
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
                    <div className={styles.brand}>
                        <div className={styles.brandMark}>M</div>
                        <div className={styles.brandCopy}>
                            <span className={styles.eyebrow}>Gracon 360</span>
                            <span className={styles.name}>Meetings</span>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <span className={styles.user}>{getDisplayName(user)}</span>
                        <button className={styles.logout} onClick={() => void logoutFromMeetings()}>
                            Sign out
                        </button>
                    </div>
                </header>
                <main className={styles.main}>{children}</main>
            </div>
        </UserContext.Provider>
    );
}
