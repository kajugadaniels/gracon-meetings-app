/**
 * Home quick-action dialogs for meeting creation, joining, and scheduling.
 */
import { CalendarDays, Clock3, Link2, Send, Video, X } from 'lucide-react';
import type { FormEvent } from 'react';
import styles from './meeting-action-dialogs.module.css';

export type MeetingActionDialogType = 'new' | 'join' | 'schedule';

interface MeetingActionDialogsProps {
    activeDialog: MeetingActionDialogType | null;
    joinUrl: string;
    onClose: () => void;
    onDialogChange: (dialog: MeetingActionDialogType) => void;
    onJoinUrlChange: (value: string) => void;
}

/**
 * Renders the active home quick-action dialog.
 */
export function MeetingActionDialogs({
    activeDialog,
    joinUrl,
    onClose,
    onDialogChange,
    onJoinUrlChange,
}: MeetingActionDialogsProps) {
    function handleJoinMeeting(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onClose();
    }

    function handleScheduleMeeting(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onClose();
    }

    if (activeDialog === 'new') {
        return (
            <div className={styles.dialogOverlay} role="presentation">
                <section
                    className={styles.dialog}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="new-meeting-title"
                >
                    <DialogHeader
                        eyebrow="New meeting"
                        title="Choose how this room should start."
                        titleId="new-meeting-title"
                        onClose={onClose}
                    />

                    <div className={styles.choiceGrid}>
                        <button type="button" onClick={onClose}>
                            <span><Video size={22} /></span>
                            <strong>Instant meeting</strong>
                            <small>Open a secure room now and invite people after it starts.</small>
                        </button>
                        <button type="button" onClick={() => onDialogChange('schedule')}>
                            <span><CalendarDays size={22} /></span>
                            <strong>Scheduled meeting</strong>
                            <small>Prepare a title, date, time, and invited guests first.</small>
                        </button>
                    </div>
                </section>
            </div>
        );
    }

    if (activeDialog === 'join') {
        return (
            <div className={styles.dialogOverlay} role="presentation">
                <section
                    className={styles.dialog}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="join-meeting-title"
                >
                    <DialogHeader
                        eyebrow="Join meeting"
                        title="Paste a Gracon meeting URL."
                        titleId="join-meeting-title"
                        onClose={onClose}
                    />

                    <form className={styles.dialogForm} onSubmit={handleJoinMeeting}>
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

    if (activeDialog === 'schedule') {
        return (
            <div className={styles.dialogOverlay} role="presentation">
                <section
                    className={styles.dialog}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="schedule-meeting-title"
                >
                    <DialogHeader
                        eyebrow="Schedule meeting"
                        title="Prepare the meeting before guests join."
                        titleId="schedule-meeting-title"
                        onClose={onClose}
                    />

                    <form className={styles.dialogForm} onSubmit={handleScheduleMeeting}>
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
                            <button type="button" onClick={onClose}>Cancel</button>
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

    return null;
}

function DialogHeader({
    eyebrow,
    title,
    titleId,
    onClose,
}: {
    eyebrow: string;
    title: string;
    titleId: string;
    onClose: () => void;
}) {
    return (
        <div className={styles.dialogHeader}>
            <div>
                <p>{eyebrow}</p>
                <h2 id={titleId}>{title}</h2>
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
    );
}
