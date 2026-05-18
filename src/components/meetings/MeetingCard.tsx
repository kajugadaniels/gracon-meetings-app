/**
 * Reusable meeting summary card.
 */
import { CalendarDays, Copy } from 'lucide-react';
import styles from './meeting-card.module.css';

export interface MeetingCardProps {
    title: string;
    date: string;
    time: string;
    attendees: string[];
    overflowCount?: number;
}

/**
 * Renders a compact meeting card that can be reused across home, upcoming,
 * previous, and recording-adjacent meeting surfaces.
 */
export function MeetingCard({
    title,
    date,
    time,
    attendees,
    overflowCount = 0,
}: MeetingCardProps) {
    return (
        <article className={styles.card}>
            <CalendarDays size={24} />
            <h2>{title}</h2>
            <p>
                {date} · {time}
            </p>
            <div className={styles.footer}>
                <div className={styles.avatarStack} aria-label="Meeting attendees">
                    {attendees.map((attendee) => (
                        <span key={attendee}>{attendee}</span>
                    ))}
                    {overflowCount > 0 && <span>+{overflowCount}</span>}
                </div>
                <div className={styles.actions}>
                    <button type="button">Start</button>
                    <button type="button">
                        <Copy size={15} />
                        Copy Invitation
                    </button>
                </div>
            </div>
        </article>
    );
}
