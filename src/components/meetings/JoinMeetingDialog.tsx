/**
 * Dialog for joining a meeting by URL.
 */
import { Link2, Send, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { MouseEvent, useState } from 'react';
import styles from './join-meeting-dialog.module.css';

interface JoinMeetingDialogProps {
    joinUrl: string;
    onClose: () => void;
    onJoinUrlChange: (value: string) => void;
}

/**
 * Renders the join meeting URL dialog.
 */
export function JoinMeetingDialog({
    joinUrl,
    onClose,
    onJoinUrlChange,
}: JoinMeetingDialogProps) {
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
                aria-labelledby="join-meeting-title"
            >
                <div className={styles.dialogHeader}>
                    <div>
                        <p>Join meeting</p>
                        <h2 id="join-meeting-title">Paste a Gracon meeting URL.</h2>
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
                        <span>Meeting URL</span>
                        <div className={styles.inputShell}>
                            <Link2 size={16} />
                            <input
                                value={joinUrl}
                                onChange={(event) => onJoinUrlChange(event.target.value)}
                                placeholder="https://gracon360.com/meet/room-id"
                                type="url"
                                required
                            />
                        </div>
                    </label>

                    <div className={styles.dialogActions}>
                        <button type="button" onClick={closeWithAnimation}>Cancel</button>
                        <button type="submit">
                            <Send size={15} />
                            Join
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
