/**
 * Ended-state surface for a closed meeting room.
 */
import { Home } from 'lucide-react';
import Link from 'next/link';
import styles from './meeting-room.module.css';

interface MeetingEndedStateProps {
    title: string;
}

/**
 * Renders the closed-room message after the host ends a meeting.
 */
export function MeetingEndedState({ title }: MeetingEndedStateProps) {
    return (
        <section className={styles.room}>
            <div className={styles.endedState}>
                <span className={styles.endedIcon}>
                    <Home size={22} />
                </span>
                <p className={styles.eyebrow}>Meeting ended</p>
                <h1>{title}</h1>
                <p>
                    This room is closed. Participants can no longer speak, chat, or
                    record in this session.
                </p>
                <Link href="/home">Go back home</Link>
            </div>
        </section>
    );
}
