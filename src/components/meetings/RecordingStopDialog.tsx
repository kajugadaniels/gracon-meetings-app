/**
 * Confirmation dialog shown before stopping a meeting recording.
 */
'use client';

import { Circle, X } from 'lucide-react';
import styles from './recording-stop-dialog.module.css';

interface RecordingStopDialogProps {
    elapsedLabel: string;
    busy?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

/**
 * Renders a focused stop-recording confirmation to avoid accidental loss of evidence.
 */
export function RecordingStopDialog({
    elapsedLabel,
    busy = false,
    onConfirm,
    onClose,
}: RecordingStopDialogProps) {
    return (
        <div
            className={styles.backdrop}
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !busy) onClose();
            }}
        >
            <section
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby="stop-recording-title"
            >
                <header>
                    <span>
                        <Circle size={15} fill="currentColor" />
                    </span>
                    <button
                        type="button"
                        aria-label="Cancel stop recording"
                        disabled={busy}
                        onClick={onClose}
                    >
                        <X size={16} />
                    </button>
                </header>
                <h2 id="stop-recording-title">Stop this recording?</h2>
                <p>
                    The recording has been running for {elapsedLabel}. Stopping it will
                    send the file for processing before it appears in recordings.
                </p>
                <div className={styles.actions}>
                    <button type="button" disabled={busy} onClick={onClose}>
                        Keep recording
                    </button>
                    <button type="button" disabled={busy} onClick={onConfirm}>
                        {busy ? 'Stopping...' : 'Stop recording'}
                    </button>
                </div>
            </section>
        </div>
    );
}
