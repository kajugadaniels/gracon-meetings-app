/**
 * Dynamic recordings dashboard backed by api/meetings recording metadata.
 */
'use client';

import { Archive, Clock3, HardDrive, Share2, Video } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    listAllVisibleMeetings,
    listVisibleMeetingRecordings,
    refreshMeetingRecordings,
} from '@/lib/meetings/api-client';
import {
    buildMeetingsSummary,
    toRecordingCardView,
    type MeetingsSummary,
    type RecordingCardView,
} from '@/lib/meetings/meeting-view-models';
import type { Meeting } from '@/lib/meetings/types';
import { RecordingsExplorer } from './RecordingsExplorer';
import styles from '@/app/(protected)/recordings/page.module.css';

const EMPTY_SUMMARY: MeetingsSummary = {
    upcomingCount: 0,
    previousCount: 0,
    recordedCount: 0,
    invitedGuestCount: 0,
    sharedRecordingCount: 0,
};

/**
 * Renders the recordings library from backend recording records.
 */
export function RecordingsDashboard() {
    const [recordings, setRecordings] = useState<RecordingCardView[]>([]);
    const [summary, setSummary] = useState<MeetingsSummary>(EMPTY_SUMMARY);
    const [meetingsById, setMeetingsById] = useState<Map<string, Meeting>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadRecordings() {
            setLoading(true);
            setError(null);

            try {
                const visibleMeetings = await listAllVisibleMeetings();
                const recordingSourceMeetings = visibleMeetings.filter((meeting) => (
                    meeting.recordingEnabled
                    || meeting.status === 'LIVE'
                    || meeting.status === 'ENDED'
                ));
                const recordingState = await listVisibleMeetingRecordings(recordingSourceMeetings);
                const nextRecordings = visibleMeetings
                    .flatMap((meeting) => (
                        (recordingState.recordingsByMeetingId.get(meeting.id) ?? [])
                            .map((recording) => toRecordingCardView(recording, meeting))
                    ))
                    .sort((first, second) => (
                        new Date(second.recordedAtIso).getTime()
                        - new Date(first.recordedAtIso).getTime()
                    ));

                if (cancelled) return;

                setMeetingsById(new Map(visibleMeetings.map((meeting) => [meeting.id, meeting])));
                setRecordings(nextRecordings);
                setSummary(buildMeetingsSummary(visibleMeetings, nextRecordings));
            } catch (err) {
                if (cancelled) return;
                setError(err instanceof Error ? err.message : 'Unable to load recordings.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadRecordings();

        return () => {
            cancelled = true;
        };
    }, []);

    const estimatedStorageGb = useMemo(() => {
        const readyRecordings = recordings.filter((recording) => recording.size !== 'Pending size');
        return Math.max(readyRecordings.length * 0.52, 0).toFixed(1);
    }, [recordings]);
    const summaryItems = useMemo(() => [
        {
            label: 'Recordings',
            value: loading ? '...' : String(summary.recordedCount),
            icon: Video,
        },
        {
            label: 'Shared',
            value: loading ? '...' : String(summary.sharedRecordingCount),
            icon: Share2,
        },
        {
            label: 'Storage used',
            value: loading ? '...' : `${estimatedStorageGb} GB`,
            icon: HardDrive,
        },
        {
            label: 'Loaded per page',
            value: '18',
            icon: Clock3,
        },
    ], [estimatedStorageGb, loading, summary.recordedCount, summary.sharedRecordingCount]);

    /**
     * Refreshes one meeting's provider playback metadata and keeps local cards in sync.
     */
    async function handleRefreshRecording(
        recording: RecordingCardView,
    ): Promise<RecordingCardView | null> {
        const meeting = meetingsById.get(recording.meetingId);
        if (!meeting) return null;

        const refreshedRows = await refreshMeetingRecordings(recording.meetingId);
        const refreshedViews = refreshedRows
            .map((row) => toRecordingCardView(row, meeting))
            .sort((first, second) => (
                new Date(second.recordedAtIso).getTime()
                - new Date(first.recordedAtIso).getTime()
            ));

        setRecordings((currentRecordings) => {
            const otherRecordings = currentRecordings.filter(
                (currentRecording) => currentRecording.meetingId !== recording.meetingId,
            );
            return [...otherRecordings, ...refreshedViews].sort((first, second) => (
                new Date(second.recordedAtIso).getTime()
                - new Date(first.recordedAtIso).getTime()
            ));
        });

        return refreshedViews.find((view) => view.id === recording.id) ?? null;
    }

    return (
        <section className={styles.page}>
            <header className={styles.hero}>
                <div>
                    <p className={styles.eyebrow}>Recordings</p>
                    <h1>Replay important rooms from one clean library.</h1>
                    <p>
                        Find recorded sessions, confirm storage state, and share approved
                        playback links without leaving the meeting workspace.
                    </p>
                </div>

                <aside className={styles.focusPanel} aria-label="Recording storage status">
                    <Archive size={20} />
                    <span>Retention status</span>
                    <strong>
                        {loading
                            ? 'Loading recording library...'
                            : recordings.length > 0
                                ? 'Current recordings are available'
                                : 'No recordings available yet'}
                    </strong>
                    <p>Secure storage · Access-controlled sharing</p>
                    <div className={styles.focusMeta}>
                        <small>{summary.recordedCount} files</small>
                        <small>{estimatedStorageGb} GB used</small>
                    </div>
                </aside>
            </header>

            <div className={styles.summaryGrid} aria-label="Recordings summary">
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

            <section className={styles.contentGrid} aria-label="Recorded meetings">
                <RecordingsExplorer
                    recordings={recordings}
                    loading={loading}
                    onRefreshRecording={handleRefreshRecording}
                />

                <aside className={styles.sidePanel} aria-label="Recording access rules">
                    <p className={styles.eyebrow}>Access rules</p>
                    <h2>Share recordings carefully</h2>
                    <ul>
                        <li>Only hosts can share protected recordings</li>
                        <li>Shared links should expire after review</li>
                        <li>Playback access should be audit logged</li>
                        <li>Retention policy must be visible before deletion</li>
                    </ul>
                </aside>
            </section>
        </section>
    );
}
