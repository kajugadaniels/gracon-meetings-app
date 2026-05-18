/**
 * Meeting recordings page.
 */
import type { Metadata } from 'next';
import { Archive, Clock3, HardDrive, Share2, Video } from 'lucide-react';
import { RecordingsExplorer } from '@/components/meetings/RecordingsExplorer';
import { getMeetingsSummary, getRecordingCards } from '@/lib/meetings/static-meetings';
import styles from './page.module.css';

export const metadata: Metadata = {
    title: 'Recordings',
    description: 'Recorded Gracon meetings.',
};

/**
 * Renders a static recordings library while playback and retention APIs mature.
 */
export default function RecordingsPage() {
    const recordings = getRecordingCards();
    const summary = getMeetingsSummary();
    const estimatedStorageGb = Math.max(summary.recordedCount * 0.52, 0).toFixed(1);
    const summaryItems = [
        {
            label: 'Recordings',
            value: String(summary.recordedCount),
            icon: Video,
        },
        {
            label: 'Shared',
            value: String(summary.sharedRecordingCount),
            icon: Share2,
        },
        {
            label: 'Storage used',
            value: `${estimatedStorageGb} GB`,
            icon: HardDrive,
        },
        {
            label: 'Loaded per page',
            value: '18',
            icon: Clock3,
        },
    ];

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
                    <strong>All current recordings are ready</strong>
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

            <section className={styles.contentGrid} aria-label="Recorded meetings">
                <RecordingsExplorer recordings={recordings} />

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
