/**
 * Dialog for joining a meeting by URL.
 */
import { Link2, Send, X } from 'lucide-react';
import type { FormEvent } from 'react';
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
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onClose();
    }

    return (
        <div className={styles.dialogOverlay} role="presentation">
            <section
                className={styles.dialog}
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
                        onClick={onClose}
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
                        <button type="button" onClick={onClose}>Cancel</button>
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
