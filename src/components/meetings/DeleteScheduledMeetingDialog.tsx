/**
 * Confirmation dialog for deleting a future scheduled meeting.
 */
'use client';

import { Loader2, Trash2, X } from 'lucide-react';
import type { MouseEvent } from 'react';
import styles from './delete-scheduled-meeting-dialog.module.css';

interface DeleteScheduledMeetingDialogProps {
    meetingTitle: string;
    deleting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

/**
 * Renders a focused destructive confirmation before a host removes a schedule.
 */
export function DeleteScheduledMeetingDialog({
    meetingTitle,
    deleting,
    onCancel,
    onConfirm,
}: DeleteScheduledMeetingDialogProps) {
    function handleOverlayMouseDown(event: MouseEvent<HTMLDivElement>) {
        if (!deleting && event.target === event.currentTarget) {
            onCancel();
        }
    }

    return (
        <div
            className={styles.overlay}
            role="presentation"
            onMouseDown={handleOverlayMouseDown}
        >
            <section
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-scheduled-meeting-title"
            >
                <button
                    type="button"
                    className={styles.closeButton}
                    onClick={onCancel}
                    disabled={deleting}
                    aria-label="Close dialog"
                >
                    <X size={17} />
                </button>
                <div className={styles.iconShell}>
                    <Trash2 size={20} />
                </div>
                <p className={styles.eyebrow}>Delete scheduled meeting</p>
                <h2 id="delete-scheduled-meeting-title">{meetingTitle}</h2>
                <p className={styles.copy}>
                    This removes the meeting from upcoming schedules and revokes pending
                    invitation links. Meetings that already happened cannot be deleted.
                </p>
                <div className={styles.actions}>
                    <button type="button" onClick={onCancel} disabled={deleting}>
                        Cancel
                    </button>
                    <button type="button" onClick={onConfirm} disabled={deleting}>
                        {deleting ? <Loader2 size={15} className={styles.spinIcon} /> : <Trash2 size={15} />}
                        {deleting ? 'Deleting...' : 'Delete meeting'}
                    </button>
                </div>
            </section>
        </div>
    );
}
