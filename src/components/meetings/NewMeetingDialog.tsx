/**
 * Dialog for choosing instant or scheduled meeting creation.
 */
import { CalendarDays, CheckCircle2, Loader2, ShieldCheck, Video, X } from 'lucide-react';
import type { MouseEvent } from 'react';
import { useState } from 'react';
import styles from './new-meeting-dialog.module.css';

interface NewMeetingDialogProps {
    error?: string | null;
    instantStarting?: boolean;
    onClose: () => void;
    onInstantStart: () => void;
    onSchedule: () => void;
}

/**
 * Renders the new meeting choice dialog.
 */
export function NewMeetingDialog({
    error,
    instantStarting = false,
    onClose,
    onInstantStart,
    onSchedule,
}: NewMeetingDialogProps) {
    const [closing, setClosing] = useState(false);

    function closeWithAnimation() {
        if (instantStarting) return;
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
                        <h2 id="new-meeting-title">Open the right room for the moment.</h2>
                        <span>Start immediately for a live discussion, or prepare a scheduled room with details and guests.</span>
                    </div>
                    <button
                        type="button"
                        className={styles.closeButton}
                        disabled={instantStarting}
                        onClick={closeWithAnimation}
                        aria-label="Close dialog"
                    >
                        <X size={17} />
                    </button>
                </div>

                <div className={styles.roomAssurance} aria-label="Meeting safeguards">
                    <span>
                        <ShieldCheck size={15} />
                        Verified access
                    </span>
                    <span>
                        <CheckCircle2 size={15} />
                        Audit-ready
                    </span>
                </div>

                {error && <p className={styles.errorMessage}>{error}</p>}

                <div className={styles.choiceGrid}>
                    <button
                        type="button"
                        className={styles.primaryChoice}
                        disabled={instantStarting}
                        onClick={onInstantStart}
                    >
                        <span className={styles.choiceIcon}>
                            {instantStarting ? (
                                <Loader2 size={18} className={styles.spinIcon} />
                            ) : (
                                <Video size={18} />
                            )}
                        </span>
                        <em>{instantStarting ? 'Opening room' : 'Instant'}</em>
                        <strong>Start now</strong>
                        <small>Create a secure room, start it, and move directly into the live meeting.</small>
                    </button>
                    <button type="button" disabled={instantStarting} onClick={onSchedule}>
                        <span className={styles.choiceIcon}>
                            <CalendarDays size={18} />
                        </span>
                        <em>Planned</em>
                        <strong>Scheduled meeting</strong>
                        <small>Prepare a title, date, time, and invited guests first.</small>
                    </button>
                </div>
            </section>
        </div>
    );
}
