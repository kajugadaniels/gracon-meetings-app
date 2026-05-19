/**
 * Dynamic upcoming meetings dashboard backed by api/meetings.
 */
'use client';

import { CalendarClock, Clock3, ShieldCheck, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    listAllVisibleMeetings,
} from '@/lib/meetings/api-client';
import {
    buildMeetingsSummary,
    splitMeetingCards,
    type MeetingCardView,
    type MeetingsSummary,
} from '@/lib/meetings/meeting-view-models';
import type { Meeting } from '@/lib/meetings/types';
import { UpcomingMeetingsExplorer } from './UpcomingMeetingsExplorer';
import styles from '@/app/(protected)/upcoming/page.module.css';

const EMPTY_SUMMARY: MeetingsSummary = {
    upcomingCount: 0,
    previousCount: 0,
    recordedCount: 0,
    invitedGuestCount: 0,
    sharedRecordingCount: 0,
};

/**
 * Renders the upcoming meetings page using real backend data.
 */
export function UpcomingMeetingsDashboard() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingCardView[]>([]);
    const [summary, setSummary] = useState<MeetingsSummary>(EMPTY_SUMMARY);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadMeetings() {
            setLoading(true);
            setError(null);

            try {
                const visibleMeetings = await listAllVisibleMeetings();

                if (cancelled) return;

                setMeetings(visibleMeetings);
                setUpcomingMeetings(splitMeetingCards(visibleMeetings).upcoming);
                setSummary(buildMeetingsSummary(visibleMeetings));
            } catch (err) {
                if (cancelled) return;
                setError(err instanceof Error ? err.message : 'Unable to load meetings.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadMeetings();

        return () => {
            cancelled = true;
        };
    }, []);

    const nextMeeting = upcomingMeetings[0];
    const summaryItems = useMemo(() => [
        {
            label: 'Upcoming',
            value: loading ? '...' : String(summary.upcomingCount),
            icon: CalendarClock,
        },
        {
            label: 'Loaded per page',
            value: '18',
            icon: Clock3,
        },
        {
            label: 'Invited guests',
            value: loading ? '...' : summary.invitedGuestCount.toLocaleString('en'),
            icon: UsersRound,
        },
        {
            label: 'Secure rooms',
            value: meetings.length > 0 ? '100%' : 'Ready',
            icon: ShieldCheck,
        },
    ], [loading, meetings.length, summary.invitedGuestCount, summary.upcomingCount]);

    return (
        <section className={styles.page}>
            <header className={styles.hero}>
                <div>
                    <p className={styles.eyebrow}>Upcoming meetings</p>
                    <h1>Keep the next room ready before people arrive.</h1>
                    <p>
                        Review scheduled sessions, invite status, and meeting readiness
                        from one clean queue.
                    </p>
                </div>

                <aside className={styles.focusPanel} aria-label="Next meeting">
                    <span>Next meeting</span>
                    <strong>{nextMeeting?.title ?? (loading ? 'Loading meetings...' : 'No scheduled meeting')}</strong>
                    <p>{nextMeeting ? `${nextMeeting.date} · ${nextMeeting.time}` : 'Schedule a secure room'}</p>
                    <div className={styles.focusMeta}>
                        <small>{nextMeeting?.visibility.replace('_', ' ').toLowerCase() ?? 'Private'}</small>
                        <small>{nextMeeting?.readiness.replace('_', ' ').toLowerCase() ?? 'Ready'}</small>
                    </div>
                </aside>
            </header>

            <div className={styles.summaryGrid} aria-label="Upcoming meetings summary">
                {summaryItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <article key={item.label} className={styles.summaryCard}>
                            <Icon size={18} />
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                        </article>
                    );
                })}
            </div>

            {error && (
                <div className={styles.errorState} role="alert">
                    {error}
                </div>
            )}

            <section className={styles.contentGrid} aria-label="Scheduled meetings">
                <UpcomingMeetingsExplorer meetings={upcomingMeetings} loading={loading} />

                <aside className={styles.sidePanel} aria-label="Preparation checklist">
                    <p className={styles.eyebrow}>Readiness</p>
                    <h2>Before the next meeting</h2>
                    <ul>
                        <li>Confirm invited participants</li>
                        <li>Attach agenda documents</li>
                        <li>Verify recording policy</li>
                        <li>Start only when the host is ready</li>
                    </ul>
                </aside>
            </section>
        </section>
    );
}
