/**
 * In-room settings dialog for local meeting controls.
 */
'use client';

import { Mic, MicOff, Video, VideoOff, X } from 'lucide-react';
import styles from './meeting-settings-dialog.module.css';

interface MeetingSettingsDialogProps {
    muted: boolean;
    cameraOff: boolean;
    onToggleMute: () => void;
    onToggleCamera: () => void;
    onClose: () => void;
}

/**
 * Renders the meeting settings surface without introducing provider-specific UI.
 */
export function MeetingSettingsDialog({
    muted,
    cameraOff,
    onToggleMute,
    onToggleCamera,
    onClose,
}: MeetingSettingsDialogProps) {
    return (
        <div
            className={styles.backdrop}
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                className={styles.dialog}
                role="dialog"
                aria-modal="true"
                aria-labelledby="meeting-settings-title"
            >
                <header className={styles.header}>
                    <div>
                        <p>Room settings</p>
                        <h2 id="meeting-settings-title">Control your meeting setup.</h2>
                    </div>
                    <button type="button" aria-label="Close settings" onClick={onClose}>
                        <X size={17} />
                    </button>
                </header>

                <div className={styles.settingList}>
                    <button type="button" className={styles.settingRow} onClick={onToggleMute}>
                        <span className={styles.settingIcon}>
                            {muted ? <MicOff size={18} /> : <Mic size={18} />}
                        </span>
                        <span>
                            <strong>Microphone</strong>
                            <small>{muted ? 'Muted for everyone' : 'Publishing audio'}</small>
                        </span>
                        <em>{muted ? 'Off' : 'On'}</em>
                    </button>

                    <button type="button" className={styles.settingRow} onClick={onToggleCamera}>
                        <span className={styles.settingIcon}>
                            {cameraOff ? <VideoOff size={18} /> : <Video size={18} />}
                        </span>
                        <span>
                            <strong>Camera</strong>
                            <small>{cameraOff ? 'Camera is stopped' : 'Video is visible'}</small>
                        </span>
                        <em>{cameraOff ? 'Off' : 'On'}</em>
                    </button>
                </div>

                <p className={styles.helper}>
                    Device selection will be connected after provider device preferences are
                    finalized. Audio and video controls update the live room immediately.
                </p>
            </section>
        </div>
    );
}
