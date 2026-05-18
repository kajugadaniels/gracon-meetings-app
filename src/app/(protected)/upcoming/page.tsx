/**
 * Upcoming meetings page.
 */
import type { Metadata } from 'next';
import { CalendarClock, Clock3, ShieldCheck, UsersRound } from 'lucide-react';
import { UpcomingMeetingsExplorer } from '@/components/meetings/UpcomingMeetingsExplorer';
import { getMeetingsSummary, getUpcomingMeetingCards } from '@/lib/meetings/static-meetings';
import styles from './page.module.css';

export const metadata: Metadata = {
    title: 'Upcoming',
    description: 'Scheduled Gracon meetings.',
};

/**
 * Renders a static upcoming meetings dashboard while scheduled-meeting APIs mature.
 */
export default function UpcomingPage() {
    const upcomingMeetings = getUpcomingMeetingCards();
    const summary = getMeetingsSummary();
    const nextMeeting = upcomingMeetings[0];
    const summaryItems = [
        {
            label: 'Upcoming',
            value: String(summary.upcomingCount),
            icon: CalendarClock,
        },
        {
            label: 'Loaded per page',
            value: '18',
            icon: Clock3,
        },
        {
            label: 'Invited guests',
            value: summary.invitedGuestCount.toLocaleString('en'),
            icon: UsersRound,
        },
        {
            label: 'Secure rooms',
            value: '100%',
            icon: ShieldCheck,
        },
    ];

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
                    <strong>{nextMeeting?.title ?? 'No scheduled meeting'}</strong>
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

            <section className={styles.contentGrid} aria-label="Scheduled meetings">
                <UpcomingMeetingsExplorer meetings={upcomingMeetings} />

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
