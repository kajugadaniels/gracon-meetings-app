/**
 * Previous meetings page.
 */
import type { Metadata } from 'next';
import { Archive, CheckCircle2, Clock3, FileText, Video } from 'lucide-react';
import { MeetingCard } from '@/components/meetings/MeetingCard';
import styles from './page.module.css';

const PREVIOUS_MEETINGS = [
    {
        title: 'Institution Registration Closeout',
        date: 'Yesterday',
        time: '4:00 PM',
        attendees: ['DK', 'OU', 'JM', 'SN'],
        overflowCount: 5,
    },
    {
        title: 'Legal Review: Service Agreement',
        date: 'Mon, 13 May',
        time: '11:30 AM',
        attendees: ['DK', 'BK', 'CM', 'YA'],
        overflowCount: 2,
    },
    {
        title: 'Finance Partner Discovery Call',
        date: 'Fri, 10 May',
        time: '9:00 AM',
        attendees: ['DK', 'RN', 'IM', 'PK'],
        overflowCount: 7,
    },
    {
        title: 'Digital Signature Workflow Review',
        date: 'Wed, 08 May',
        time: '2:15 PM',
        attendees: ['DK', 'PN', 'EM', 'LS'],
        overflowCount: 4,
    },
];

const SUMMARY_ITEMS = [
    {
        label: 'Completed',
        value: '24',
        icon: CheckCircle2,
    },
    {
        label: 'Recorded',
        value: '13',
        icon: Video,
    },
    {
        label: 'Follow-ups',
        value: '8',
        icon: FileText,
    },
    {
        label: 'Avg duration',
        value: '42m',
        icon: Clock3,
    },
];

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
    return (
        <section className={styles.page}>
            <header className={styles.hero}>
                <div>
                    <p className={styles.eyebrow}>Previous meetings</p>
                    <h1>Find completed sessions without digging.</h1>
                    <p>
                        Review ended meetings, confirm recordings, and keep follow-up work
                        visible before it disappears into chat or email.
                    </p>
                </div>

                <aside className={styles.focusPanel} aria-label="Latest completed meeting">
                    <Archive size={20} />
                    <span>Latest completed</span>
                    <strong>Institution Registration Closeout</strong>
                    <p>Yesterday · 4:00 PM · Recording ready</p>
                </aside>
            </header>

            <div className={styles.summaryGrid} aria-label="Previous meetings summary">
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
                <div className={styles.filters} aria-label="Previous meeting filters">
                    <button type="button" className={styles.activeFilter}>All</button>
                    <button type="button">Recorded</button>
                    <button type="button">This month</button>
                    <button type="button">Needs follow-up</button>
                </div>
                <button type="button" className={styles.archiveButton}>
                    Export history
                </button>
            </div>

            <section className={styles.contentGrid} aria-label="Completed meetings">
                <div className={styles.meetingList}>
                    {PREVIOUS_MEETINGS.map((meeting) => (
                        <MeetingCard
                            key={`${meeting.title}-${meeting.time}`}
                            title={meeting.title}
                            date={meeting.date}
                            time={meeting.time}
                            attendees={meeting.attendees}
                            overflowCount={meeting.overflowCount}
                        />
                    ))}
                </div>

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
