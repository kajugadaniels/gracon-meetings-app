/**
 * Top navigation bar for the authenticated meetings workspace.
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { SessionUser } from '@/app/(protected)/layout';
import { logoutFromMeetings } from '@/lib/session';
import styles from './meetings-shell.module.css';

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

function getProfileImageSource(user: SessionUser) {
    if (!user.imageUrl) return null;
    return `/api/profile-image?user=${encodeURIComponent(user.userId)}`;
}

/**
 * Renders the fixed topbar with logo and account dropdown.
 */
export function MeetingsTopbar({ user }: { user: SessionUser }) {
    const [accountOpen, setAccountOpen] = useState(false);
    const accountRef = useRef<HTMLDivElement>(null);
    const profileImageSource = getProfileImageSource(user);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (!accountRef.current?.contains(event.target as Node)) {
                setAccountOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, []);

    return (
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
                    {profileImageSource ? (
                        <Image
                            src={profileImageSource}
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
                                {profileImageSource ? (
                                    <Image
                                        src={profileImageSource}
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
    );
}
