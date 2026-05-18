/**
 * Dialog for scheduling a meeting.
 */
import { CalendarDays, Clock3, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { MouseEvent, useState } from 'react';
import styles from './schedule-meeting-dialog.module.css';

interface ScheduleMeetingDialogProps {
    onClose: () => void;
}

/**
 * Renders the schedule meeting form dialog.
 */
export function ScheduleMeetingDialog({ onClose }: ScheduleMeetingDialogProps) {
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

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        closeWithAnimation();
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
                aria-labelledby="schedule-meeting-title"
            >
                <div className={styles.dialogHeader}>
                    <div>
                        <p>Schedule meeting</p>
                        <h2 id="schedule-meeting-title">Prepare the meeting before guests join.</h2>
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

                <form className={styles.dialogForm} onSubmit={handleSubmit}>
                    <label className={styles.field}>
                        <span>Meeting title</span>
                        <input type="text" placeholder="Board review" required />
                    </label>
                    <div className={styles.formGrid}>
                        <label className={styles.field}>
                            <span>Date</span>
                            <input type="date" required />
                        </label>
                        <label className={styles.field}>
                            <span>Time</span>
                            <div className={styles.inputShell}>
                                <Clock3 size={16} />
                                <input type="time" required />
                            </div>
                        </label>
                    </div>
                    <label className={styles.field}>
                        <span>Guests</span>
                        <input type="text" placeholder="emails separated by commas" />
                    </label>
                    <label className={styles.field}>
                        <span>Agenda</span>
                        <textarea placeholder="Add the main discussion points" rows={4} />
                    </label>

                    <div className={styles.dialogActions}>
                        <button type="button" onClick={closeWithAnimation}>Cancel</button>
                        <button type="submit">
                            <CalendarDays size={15} />
                            Schedule
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
