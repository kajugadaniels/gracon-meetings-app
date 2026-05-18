/**
 * Members panel for the static meeting room.
 */
import type { MeetingRoomAttendeeView } from '@/lib/meetings/static-meetings';
import styles from './meeting-members-panel.module.css';

interface MeetingMembersPanelProps {
    attendees: MeetingRoomAttendeeView[];
    attendeeCount: number;
}

/**
 * Renders a compact in-room member list.
 */
export function MeetingMembersPanel({
    attendees,
    attendeeCount,
}: MeetingMembersPanelProps) {
    return (
        <section className={styles.panel}>
            <div className={styles.panelHeader}>
                <h2>Members</h2>
                <span>{attendeeCount}</span>
            </div>
            <div className={styles.memberList}>
                {attendees.slice(0, 7).map((attendee) => (
                    <article key={attendee.email} className={styles.memberItem}>
                        <span>{attendee.initials}</span>
                        <div>
                            <strong>{attendee.name}</strong>
                            <small>{attendee.role}</small>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
