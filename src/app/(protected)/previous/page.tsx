/**
 * Previous meetings page.
 */
import type { Metadata } from 'next';
import { Archive, CheckCircle2, Clock3, FileText, Video } from 'lucide-react';
import { PreviousMeetingsExplorer } from '@/components/meetings/PreviousMeetingsExplorer';
import { getMeetingsSummary, getPreviousMeetingCards } from '@/lib/meetings/static-meetings';
import styles from './page.module.css';

const FOLLOW_UPS = [
    'Share the signed agreement package',
    'Attach meeting notes to the institution profile',
    'Confirm pending invitee attendance',
    'Move completed recordings to the archive',
];

export const metadata: Metadata = {
    title: 'Previous',
    description: 'Completed Gracon meetings.',
};

/**
 * Renders a static previous-meetings dashboard for completed sessions.
 */
export default function PreviousPage() {
    const previousMeetings = getPreviousMeetingCards();
    const summary = getMeetingsSummary();
    const latestMeeting = previousMeetings[0];
    const summaryItems = [
        {
            label: 'Completed',
            value: String(summary.previousCount),
            icon: CheckCircle2,
        },
        {
            label: 'Recorded',
            value: String(summary.recordedCount),
            icon: Video,
        },
        {
            label: 'Follow-ups',
            value: '8',
            icon: FileText,
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
                    <strong>{latestMeeting?.title ?? 'No completed meeting'}</strong>
                    <p>{latestMeeting ? `${latestMeeting.date} · ${latestMeeting.time}` : 'Completed meetings appear here'}</p>
                    <div className={styles.focusMeta}>
                        <small>Recording ready</small>
                        <small>Follow-up open</small>
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

            <section className={styles.contentGrid} aria-label="Completed meetings">
                <PreviousMeetingsExplorer meetings={previousMeetings} />

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
