/**
 * Dialog for choosing instant or scheduled meeting creation.
 */
import { CalendarDays, Video, X } from 'lucide-react';
import type { MouseEvent } from 'react';
import { useState } from 'react';
import styles from './new-meeting-dialog.module.css';

interface NewMeetingDialogProps {
    onClose: () => void;
    onSchedule: () => void;
}

/**
 * Renders the new meeting choice dialog.
 */
export function NewMeetingDialog({ onClose, onSchedule }: NewMeetingDialogProps) {
    const [closing, setClosing] = useState(false);

    function closeWithAnimation() {
        setClosing(true);
        window.setTimeout(onClose, 140);
    }

    function handleOverlayMouseDown(event: MouseEvent<HTMLDivElement>) {
        if (event.target === event.currentTarget) {
            closeWithAnimation();
        }
    }

    return (
        <div
            className={`${styles.dialogOverlay} ${closing ? styles.dialogOverlayClosing : ''}`}
            role="presentation"
            onMouseDown={handleOverlayMouseDown}
        >
            <section
                className={`${styles.dialog} ${closing ? styles.dialogClosing : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="new-meeting-title"
            >
                <div className={styles.dialogHeader}>
                    <div>
                        <p>New meeting</p>
                        <h2 id="new-meeting-title">Choose how this room should start.</h2>
                        <span>Use instant for a live room, or schedule when guests need notice.</span>
                    </div>
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={closeWithAnimation}
                        aria-label="Close dialog"
                    >
                        <X size={17} />
                    </button>
                </div>

                <div className={styles.choiceGrid}>
                    <button type="button" onClick={closeWithAnimation}>
                        <span className={styles.choiceIcon}><Video size={18} /></span>
                        <em>Fastest</em>
                        <strong>Instant meeting</strong>
                        <small>Open a secure room now and invite people after it starts.</small>
                    </button>
                    <button type="button" onClick={onSchedule}>
                        <span className={styles.choiceIcon}><CalendarDays size={18} /></span>
                        <em>Planned</em>
                        <strong>Scheduled meeting</strong>
                        <small>Prepare a title, date, time, and invited guests first.</small>
                    </button>
                </div>
            </section>
        </div>
    );
}
