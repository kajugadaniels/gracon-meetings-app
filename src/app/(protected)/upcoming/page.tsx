/**
 * Upcoming meetings page.
 */
import type { Metadata } from 'next';
import { CalendarClock, Clock3, ShieldCheck, UsersRound } from 'lucide-react';
import { MeetingCard } from '@/components/meetings/MeetingCard';
import { UpcomingScheduleButton } from '@/components/meetings/UpcomingScheduleButton';
import styles from './page.module.css';

const UPCOMING_MEETINGS = [
    {
        title: 'Institution Onboarding Review',
        date: 'Today',
        time: '10:00 AM',
        attendees: ['DK', 'OU', 'JM', 'SN'],
        overflowCount: 6,
    },
    {
        title: 'Product Roadmap Alignment',
        date: 'Today',
        time: '1:30 PM',
        attendees: ['DK', 'RN', 'IM', 'AK'],
        overflowCount: 4,
    },
    {
        title: 'Compliance Document Walkthrough',
        date: 'Tomorrow',
        time: '9:15 AM',
        attendees: ['DK', 'BK', 'CM', 'YA'],
        overflowCount: 3,
    },
    {
        title: 'Partner Banking Integration Check',
        date: 'Friday',
        time: '3:00 PM',
        attendees: ['DK', 'PN', 'EM', 'LS'],
        overflowCount: 8,
    },
];

const SUMMARY_ITEMS = [
    {
        label: 'Today',
        value: '2',
        icon: CalendarClock,
    },
    {
        label: 'This week',
        value: '7',
        icon: Clock3,
    },
    {
        label: 'Invited guests',
        value: '31',
        icon: UsersRound,
    },
    {
        label: 'Secure rooms',
        value: '100%',
        icon: ShieldCheck,
    },
];

export const metadata: Metadata = {
    title: 'Upcoming',
    description: 'Scheduled Gracon meetings.',
};

/**
 * Renders a static upcoming meetings dashboard while scheduled-meeting APIs mature.
 */
export default function UpcomingPage() {
    return (
        <section className={styles.page}>
            <header className={styles.hero}>
                <div>
                    <p className={styles.eyebrow}>Upcoming meetings</p>
                    <h1>Plan the day before the room opens.</h1>
                    <p>
                        Review scheduled sessions, check invite readiness, and start the
                        right Gracon room when the meeting begins.
                    </p>
                </div>

                <aside className={styles.focusPanel} aria-label="Next meeting">
                    <span>Next meeting</span>
                    <strong>Institution Onboarding Review</strong>
                    <p>Today · 10:00 AM · Invite only</p>
                </aside>
            </header>

            <div className={styles.summaryGrid} aria-label="Upcoming meetings summary">
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
                <div className={styles.filters} aria-label="Meeting filters">
                    <button type="button" className={styles.activeFilter}>All</button>
                    <button type="button">Today</button>
                    <button type="button">This week</button>
                    <button type="button">Invite only</button>
                </div>
                <UpcomingScheduleButton />
            </div>

            <section className={styles.contentGrid} aria-label="Scheduled meetings">
                <div className={styles.meetingList}>
                    {UPCOMING_MEETINGS.map((meeting) => (
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
