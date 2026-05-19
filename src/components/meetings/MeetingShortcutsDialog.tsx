/**
 * Discoverable keyboard shortcut reference for the live meeting room.
 */
'use client';

import { Keyboard, X } from 'lucide-react';
import styles from './meeting-shortcuts-dialog.module.css';

const SHORTCUTS = [
    { key: 'M', label: 'Mute or unmute microphone' },
    { key: 'V', label: 'Start or stop camera' },
    { key: 'S', label: 'Start or stop screen sharing' },
    { key: 'R', label: 'Start recording or confirm stop' },
    { key: 'H', label: 'Raise or lower hand' },
    { key: 'Esc', label: 'Close panels and dialogs' },
];

interface MeetingShortcutsDialogProps {
    onClose: () => void;
}

/**
 * Renders a small keyboard guide so power controls are visible without cluttering the room.
 */
export function MeetingShortcutsDialog({ onClose }: MeetingShortcutsDialogProps) {
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
                aria-labelledby="meeting-shortcuts-title"
            >
                <header className={styles.header}>
                    <span className={styles.icon}>
                        <Keyboard size={18} />
                    </span>
                    <button type="button" aria-label="Close shortcuts" onClick={onClose}>
                        <X size={16} />
                    </button>
                </header>

                <p className={styles.eyebrow}>Room shortcuts</p>
                <h2 id="meeting-shortcuts-title">Move faster during meetings.</h2>
                <p className={styles.description}>
                    Shortcuts are ignored while typing in chat, forms, or other editable fields.
                </p>

                <div className={styles.shortcutList}>
                    {SHORTCUTS.map((shortcut) => (
                        <div key={shortcut.key} className={styles.shortcutRow}>
                            <kbd>{shortcut.key}</kbd>
                            <span>{shortcut.label}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
