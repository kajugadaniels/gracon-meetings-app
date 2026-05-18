/**
 * Reusable recorded meeting card.
 */
import { Play, Share2 } from 'lucide-react';
import styles from './recording-card.module.css';

export interface RecordingCardProps {
    title: string;
    recordedAt: string;
    duration: string;
    size: string;
    status: string;
    owner: string;
}

/**
 * Renders a recorded meeting summary with playback and share actions.
 */
export function RecordingCard({
    title,
    recordedAt,
    duration,
    size,
    status,
    owner,
}: RecordingCardProps) {
    return (
        <article className={styles.card}>
            <div className={styles.preview} aria-hidden="true">
                <Play size={18} fill="currentColor" />
                <span>{duration}</span>
            </div>

            <div className={styles.body}>
                <div className={styles.metaRow}>
                    <span>{status}</span>
                    <small>{size}</small>
                </div>
                <h2>{title}</h2>
                <p>{recordedAt}</p>
                <small className={styles.owner}>Recorded by {owner}</small>
            </div>

            <div className={styles.actions}>
                <button type="button">
                    <Play size={15} fill="currentColor" />
                    Play
                </button>
                <button type="button">
                    <Share2 size={15} />
                    Share
                </button>
            </div>
        </article>
    );
}
