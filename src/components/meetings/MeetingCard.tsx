/**
 * Reusable meeting summary card.
 */
import { CalendarDays, Clock3, Copy } from 'lucide-react';
import Link from 'next/link';
import styles from './meeting-card.module.css';

export interface MeetingCardProps {
    title: string;
    date: string;
    time: string;
    attendees: string[];
    overflowCount?: number;
    meetingId?: string;
    durationLabel?: string;
    showActions?: boolean;
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
    meetingId,
    durationLabel,
    showActions = true,
}: MeetingCardProps) {
    return (
        <article className={styles.card}>
            <CalendarDays size={24} />
            <h2 className={styles.title}>{title}</h2>
            <p>
                {date} · {time}
            </p>
            {durationLabel && (
                <span className={styles.duration}>
                    <Clock3 size={13} />
                    {durationLabel}
                </span>
            )}
            <div className={styles.footer}>
                <div className={styles.avatarStack} aria-label="Meeting attendees">
                    {attendees.map((attendee) => (
                        <span key={attendee}>{attendee}</span>
                    ))}
                    {overflowCount > 0 && <span>+{overflowCount}</span>}
                </div>
                {showActions && (
                    <div className={styles.actions}>
                        {meetingId ? (
                            <Link href={`/meetings/${meetingId}`}>Start</Link>
                        ) : (
                            <button type="button">Start</button>
                        )}
                        <button type="button">
                            <Copy size={15} />
                            Copy Invitation
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
}
