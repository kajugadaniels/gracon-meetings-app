/**
 * Dynamic previous meetings dashboard backed by api/meetings.
 */
'use client';

import { Archive, CheckCircle2, Clock3, FileText, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    listAllVisibleMeetings,
    listVisibleMeetingRecordings,
} from '@/lib/meetings/api-client';
import {
    buildMeetingsSummary,
    splitMeetingCards,
    type MeetingCardView,
    type MeetingsSummary,
} from '@/lib/meetings/meeting-view-models';
import { PreviousMeetingsExplorer } from './PreviousMeetingsExplorer';
import styles from '@/app/(protected)/previous/page.module.css';

const FOLLOW_UPS = [
    'Share the signed agreement package',
    'Attach meeting notes to the institution profile',
    'Confirm pending invitee attendance',
    'Move completed recordings to the archive',
];

const EMPTY_SUMMARY: MeetingsSummary = {
    upcomingCount: 0,
    previousCount: 0,
    recordedCount: 0,
    invitedGuestCount: 0,
    sharedRecordingCount: 0,
};

/**
 * Renders completed meeting history from backend data.
 */
export function PreviousMeetingsDashboard() {
    const [previousMeetings, setPreviousMeetings] = useState<MeetingCardView[]>([]);
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
                const previousSourceMeetings = visibleMeetings.filter((meeting) => (
                    meeting.status === 'ENDED' || meeting.status === 'CANCELLED'
                ));
                const recordingState = await listVisibleMeetingRecordings(previousSourceMeetings);

                if (cancelled) return;

                setPreviousMeetings(
                    splitMeetingCards(
                        visibleMeetings,
                        recordingState.recordingsByMeetingId,
                    ).previous,
                );
                setSummary(buildMeetingsSummary(visibleMeetings, []));
            } catch (err) {
                if (cancelled) return;
                setError(err instanceof Error ? err.message : 'Unable to load meeting history.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadMeetings();

        return () => {
            cancelled = true;
        };
    }, []);

    const latestMeeting = previousMeetings[0];
    const recordedCount = previousMeetings.filter((meeting) => meeting.hasRecording).length;
    const summaryItems = useMemo(() => [
        {
            label: 'Completed',
            value: loading ? '...' : String(summary.previousCount),
            icon: CheckCircle2,
        },
        {
            label: 'Recorded',
            value: loading ? '...' : String(recordedCount),
            icon: Video,
        },
        {
            label: 'Follow-ups',
            value: loading
                ? '...'
                : String(previousMeetings.filter((meeting) => meeting.needsFollowUp).length),
            icon: FileText,
        },
        {
            label: 'Loaded per page',
            value: '18',
            icon: Clock3,
        },
    ], [loading, previousMeetings, recordedCount, summary.previousCount]);

    return (
        <section className={styles.page}>
            <header className={styles.hero}>
                <div>
                    <p className={styles.eyebrow}>Previous meetings</p>
                    <h1>Review completed sessions without digging.</h1>
                    <p>
                        Confirm recordings, scan follow-up work, and reopen the right
                        meeting context when decisions need proof.
                    </p>
                </div>

                <aside className={styles.focusPanel} aria-label="Latest completed meeting">
                    <Archive size={20} />
                    <span>Latest completed</span>
                    <strong>{latestMeeting?.title ?? (loading ? 'Loading history...' : 'No completed meeting')}</strong>
                    <p>{latestMeeting ? `${latestMeeting.date} · ${latestMeeting.time}` : 'Completed meetings appear here'}</p>
                    <div className={styles.focusMeta}>
                        <small>{latestMeeting?.hasRecording ? 'Recording ready' : 'No recording'}</small>
                        <small>{latestMeeting?.needsFollowUp ? 'Follow-up open' : 'Reviewed'}</small>
                    </div>
                </aside>
            </header>

            <div className={styles.summaryGrid} aria-label="Previous meetings summary">
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

            <section className={styles.contentGrid} aria-label="Completed meetings">
                <PreviousMeetingsExplorer meetings={previousMeetings} loading={loading} />

                <aside className={styles.sidePanel} aria-label="Follow-up checklist">
                    <p className={styles.eyebrow}>Follow-up queue</p>
                    <h2>Keep momentum after calls</h2>
                    <ul>
                        {FOLLOW_UPS.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </aside>
            </section>
        </section>
    );
}
