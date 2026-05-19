/**
 * Reusable meeting summary card.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Copy, LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/components/ui';
import { getMeetingJoinPath } from '@/lib/meetings/api-client';
import type { MeetingStatus } from '@/lib/meetings/types';
import styles from './meeting-card.module.css';

export interface MeetingCardProps {
    title: string;
    status?: MeetingStatus;
    date: string;
    time: string;
    scheduledStartAt?: string;
    attendees: string[];
    overflowCount?: number;
    meetingId?: string;
    durationLabel?: string;
    showActions?: boolean;
}

/**
 * Builds a shareable absolute room URL without trusting stale title query params.
 */
function buildMeetingUrl(meetingId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_MEETINGS_PUBLIC_URL
        || process.env.NEXT_PUBLIC_MEETINGS_URL
        || (typeof window !== 'undefined' ? window.location.origin : '');

    return `${baseUrl.replace(/\/$/, '')}${getMeetingJoinPath(meetingId)}`;
}

/**
 * Formats future scheduled starts for disabled meeting actions.
 */
function formatStartNotice(): string {
    return 'Opens at meeting time';
}

/**
 * Keeps date presentation compact so meeting cards do not repeat timestamps.
 */
function formatCompactDate(date: string): string {
    return date.replace(/,\s*\d{4}$/, '');
}

/**
 * Converts lifecycle constants into readable card labels.
 */
function formatStatus(status?: MeetingStatus): string {
    if (!status) return 'Meeting';
    return status.toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
}

/**
 * Renders a compact meeting card that can be reused across home, upcoming,
 * previous, and recording-adjacent meeting surfaces.
 */
export function MeetingCard({
    title,
    status,
    date,
    time,
    scheduledStartAt,
    attendees,
    overflowCount = 0,
    meetingId,
    durationLabel,
    showActions = true,
}: MeetingCardProps) {
    const [now, setNow] = useState(() => Date.now());
    const scheduledStartTime = scheduledStartAt
        ? new Date(scheduledStartAt).getTime()
        : null;
    const startDisabled = status === 'SCHEDULED'
        && Boolean(scheduledStartTime)
        && Number(scheduledStartTime) > now;
    const startNotice = useMemo(
        () => formatStartNotice(),
        [],
    );
    const compactDate = useMemo(() => formatCompactDate(date), [date]);

    useEffect(() => {
        if (!startDisabled || !scheduledStartTime) return undefined;

        const timeout = window.setTimeout(
            () => setNow(Date.now()),
            Math.min(Math.max(scheduledStartTime - now, 1000), 60_000),
        );

        return () => window.clearTimeout(timeout);
    }, [now, scheduledStartTime, startDisabled]);

    /**
     * Copies the canonical meeting URL while leaving invite verification links separate.
     */
    async function handleCopyUrl() {
        if (!meetingId) {
            toast.error('Meeting URL unavailable', {
                description: 'This meeting has not been saved yet.',
            });
            return;
        }

        try {
            await navigator.clipboard.writeText(buildMeetingUrl(meetingId));
            toast.success('Meeting URL copied', {
                description: 'Share it only with people who should access this room.',
            });
        } catch {
            toast.error('Could not copy URL', {
                description: 'Copy permission was blocked by the browser.',
            });
        }
    }

    return (
        <article className={styles.card}>
            <header className={styles.header}>
                <span className={styles.dateBadge}>
                    <CalendarDays size={18} />
                    <span>{compactDate}</span>
                </span>
                {status && <span className={styles.status}>{formatStatus(status)}</span>}
            </header>
            <div className={styles.body}>
                <h2 className={styles.title}>{title}</h2>
                <div className={styles.metaRow}>
                    <span className={styles.timeMeta}>
                        <Clock3 size={13} />
                        {time}
                    </span>
                    {startDisabled && (
                        <span className={styles.startNotice}>
                            <LockKeyhole size={13} />
                            {startNotice}
                        </span>
                    )}
                    {durationLabel && (
                        <span className={styles.duration}>
                            <Clock3 size={13} />
                            {durationLabel}
                        </span>
                    )}
                </div>
            </div>
            <div className={styles.footer}>
                <div className={styles.avatarStack} aria-label="Meeting attendees">
                    {attendees.map((attendee) => (
                        <span key={attendee}>{attendee}</span>
                    ))}
                    {overflowCount > 0 && <span>+{overflowCount}</span>}
                </div>
                {showActions && (
                    <div className={styles.actions}>
                        {meetingId && !startDisabled ? (
                            <Link href={getMeetingJoinPath(meetingId)}>Start</Link>
                        ) : (
                            <button
                                type="button"
                                disabled={startDisabled}
                                title={startDisabled ? startNotice : undefined}
                            >
                                Start
                            </button>
                        )}
                        <button type="button" onClick={handleCopyUrl}>
                            <Copy size={15} />
                            Copy URL
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
}
