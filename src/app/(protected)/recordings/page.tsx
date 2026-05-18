/**
 * Meeting recordings page.
 */
import type { Metadata } from 'next';
import { Archive, Clock3, HardDrive, Share2, Video } from 'lucide-react';
import { RecordingCard } from '@/components/meetings/RecordingCard';
import styles from './page.module.css';

const RECORDINGS = [
    {
        title: 'Institution Registration Closeout',
        recordedAt: 'Recorded yesterday at 4:48 PM',
        duration: '46:12',
        size: '680 MB',
        status: 'Ready',
        owner: 'Daniel KAJUGA',
    },
    {
        title: 'Legal Review: Service Agreement',
        recordedAt: 'Recorded Mon, 13 May at 12:18 PM',
        duration: '38:04',
        size: '512 MB',
        status: 'Ready',
        owner: 'Daniel KAJUGA',
    },
    {
        title: 'Finance Partner Discovery Call',
        recordedAt: 'Recorded Fri, 10 May at 9:52 AM',
        duration: '55:41',
        size: '790 MB',
        status: 'Ready',
        owner: 'Daniel KAJUGA',
    },
    {
        title: 'Digital Signature Workflow Review',
        recordedAt: 'Recorded Wed, 08 May at 3:03 PM',
        duration: '29:36',
        size: '344 MB',
        status: 'Ready',
        owner: 'Daniel KAJUGA',
    },
    {
        title: 'Institution Verification Retrospective',
        recordedAt: 'Recorded Tue, 07 May at 11:24 AM',
        duration: '33:18',
        size: '406 MB',
        status: 'Ready',
        owner: 'Daniel KAJUGA',
    },
    {
        title: 'Template Library Review',
        recordedAt: 'Recorded Mon, 06 May at 4:02 PM',
        duration: '25:50',
        size: '318 MB',
        status: 'Ready',
        owner: 'Daniel KAJUGA',
    },
];

const SUMMARY_ITEMS = [
    {
        label: 'Recordings',
        value: '13',
        icon: Video,
    },
    {
        label: 'Shared',
        value: '5',
        icon: Share2,
    },
    {
        label: 'Storage used',
        value: '6.8 GB',
        icon: HardDrive,
    },
    {
        label: 'Avg length',
        value: '42m',
        icon: Clock3,
    },
];

export const metadata: Metadata = {
    title: 'Recordings',
    description: 'Recorded Gracon meetings.',
};

/**
 * Renders a static recordings library while playback and retention APIs mature.
 */
export default function RecordingsPage() {
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
                        <small>13 files</small>
                        <small>6.8 GB used</small>
                    </div>
                </aside>
            </header>

            <div className={styles.summaryGrid} aria-label="Recordings summary">
                {SUMMARY_ITEMS.map((item) => {
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

            <div className={styles.toolbar}>
                <div className={styles.filters} aria-label="Recording filters">
                    <button type="button" className={styles.activeFilter}>All</button>
                    <button type="button">Ready</button>
                    <button type="button">Shared</button>
                    <button type="button">This month</button>
                </div>
                <button type="button" className={styles.storageButton}>
                    Manage storage
                </button>
            </div>

            <section className={styles.contentGrid} aria-label="Recorded meetings">
                <div className={styles.recordingList}>
                    {RECORDINGS.map((recording) => (
                        <RecordingCard
                            key={`${recording.title}-${recording.duration}`}
                            title={recording.title}
                            recordedAt={recording.recordedAt}
                            duration={recording.duration}
                            size={recording.size}
                            status={recording.status}
                            owner={recording.owner}
                        />
                    ))}
                </div>

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
