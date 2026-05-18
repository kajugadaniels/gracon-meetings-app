/**
 * Dialog for choosing instant or scheduled meeting creation.
 */
import { CalendarDays, Video, X } from 'lucide-react';
import styles from './new-meeting-dialog.module.css';

interface NewMeetingDialogProps {
    onClose: () => void;
    onSchedule: () => void;
}

/**
 * Renders the new meeting choice dialog.
 */
export function NewMeetingDialog({ onClose, onSchedule }: NewMeetingDialogProps) {
    return (
        <div className={styles.dialogOverlay} role="presentation">
            <section
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby="new-meeting-title"
            >
                <div className={styles.dialogHeader}>
                    <div>
                        <p>New meeting</p>
                        <h2 id="new-meeting-title">Choose how this room should start.</h2>
                    </div>
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="Close dialog"
                    >
                        <X size={17} />
                    </button>
                </div>

                <div className={styles.choiceGrid}>
                    <button type="button" onClick={onClose}>
                        <span><Video size={22} /></span>
                        <strong>Instant meeting</strong>
                        <small>Open a secure room now and invite people after it starts.</small>
                    </button>
                    <button type="button" onClick={onSchedule}>
                        <span><CalendarDays size={22} /></span>
                        <strong>Scheduled meeting</strong>
                        <small>Prepare a title, date, time, and invited guests first.</small>
                    </button>
                </div>
            </section>
        </div>
    );
}
