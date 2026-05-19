/**
 * Compact room notice surface for persistent live-room warnings.
 */
import { AlertCircle, Info } from 'lucide-react';
import styles from './meeting-room-notice.module.css';

interface MeetingRoomNoticeProps {
    tone: 'error' | 'info';
    message: string;
}

/**
 * Renders room-level notices that should remain visible after toast feedback fades.
 */
export function MeetingRoomNotice({ tone, message }: MeetingRoomNoticeProps) {
    return (
        <p className={`${styles.notice} ${tone === 'error' ? styles.error : styles.info}`}>
            {tone === 'error' ? <AlertCircle size={15} /> : <Info size={15} />}
            <span>{message}</span>
        </p>
    );
}
