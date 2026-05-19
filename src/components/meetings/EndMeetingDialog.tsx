/**
 * Confirmation dialog for ending a live meeting room.
 */
'use client';

import { AlertTriangle, Circle, PhoneOff, UsersRound, X } from 'lucide-react';
import styles from './end-meeting-dialog.module.css';

interface EndMeetingDialogProps {
    attendeeCount: number;
    recording: boolean;
    recordingElapsedLabel: string;
    ending?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

/**
 * Renders a guarded end-meeting confirmation before closing the room for everyone.
 */
export function EndMeetingDialog({
    attendeeCount,
    recording,
    recordingElapsedLabel,
    ending = false,
    onConfirm,
    onClose,
}: EndMeetingDialogProps) {
    return (
        <div
            className={styles.backdrop}
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !ending) onClose();
            }}
        >
            <section
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby="end-meeting-title"
            >
                <header className={styles.header}>
                    <span className={styles.icon}>
                        <PhoneOff size={18} />
                    </span>
                    <button
                        type="button"
                        aria-label="Cancel ending meeting"
                        disabled={ending}
                        onClick={onClose}
                    >
                        <X size={16} />
                    </button>
                </header>

                <p className={styles.eyebrow}>End meeting</p>
                <h2 id="end-meeting-title">Close this room for everyone?</h2>
                <p className={styles.description}>
                    Participants will lose access to audio, video, chat, and room controls
                    once the meeting is ended.
                </p>

                <div className={styles.impactGrid} aria-label="End meeting impact">
                    <div>
                        <UsersRound size={16} />
                        <span>{attendeeCount} participants</span>
                    </div>
                    <div className={recording ? styles.recordingImpact : ''}>
                        <Circle size={12} fill="currentColor" />
                        <span>
                            {recording
                                ? `Recording active · ${recordingElapsedLabel}`
                                : 'Recording is off'}
                        </span>
                    </div>
                </div>

                {recording && (
                    <p className={styles.warning}>
                        <AlertTriangle size={15} />
                        Ending now will stop the live session. Stop the recording first if you
                        need a clean recording boundary.
                    </p>
                )}

                <div className={styles.actions}>
                    <button type="button" disabled={ending} onClick={onClose}>
                        Keep meeting open
                    </button>
                    <button type="button" disabled={ending} onClick={onConfirm}>
                        {ending ? 'Ending...' : 'End meeting'}
                    </button>
                </div>
            </section>
        </div>
    );
}
