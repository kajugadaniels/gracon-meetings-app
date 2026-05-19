/**
 * Advanced playback dialog for meeting recordings.
 */
'use client';

import { Download, Headphones, LockKeyhole, RefreshCw, Share2, ShieldCheck, X } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { RecordingCardView } from '@/lib/meetings/meeting-view-models';
import styles from './recording-player-dialog.module.css';

interface RecordingPlayerDialogProps {
    recording: RecordingCardView;
    onClose: () => void;
    onRefreshPlayback?: (recording: RecordingCardView) => void;
    onShare: (recording: RecordingCardView) => void;
    refreshing?: boolean;
}

/**
 * Renders a secure recording player with metadata and processing fallback state.
 */
export function RecordingPlayerDialog({
    recording,
    onClose,
    onRefreshPlayback,
    onShare,
    refreshing = false,
}: RecordingPlayerDialogProps) {
    const canPlay = Boolean(recording.playbackUrl);

    function handleOverlayMouseDown(event: MouseEvent<HTMLDivElement>) {
        if (event.target === event.currentTarget) {
            onClose();
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
                aria-labelledby="recording-player-title"
            >
                <header className={styles.header}>
                    <div>
                        <p>Secure playback</p>
                        <h2 id="recording-player-title">{recording.title}</h2>
                        <span>{recording.recordedAt}</span>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close recording player">
                        <X size={18} />
                    </button>
                </header>

                <div className={styles.playerShell}>
                    {canPlay ? (
                        <video
                            className={styles.player}
                            src={recording.playbackUrl ?? undefined}
                            controls
                            controlsList="nodownload"
                            preload="metadata"
                        />
                    ) : (
                        <div className={styles.processingState} role="status">
                            <span>
                                <Headphones size={24} />
                            </span>
                            <strong>Playback file is still processing</strong>
                            <p>
                                The recording metadata is available now. The video and audio asset
                                will become playable after the provider finishes processing it.
                            </p>
                            {onRefreshPlayback && (
                                <button
                                    type="button"
                                    className={styles.refreshButton}
                                    disabled={refreshing}
                                    onClick={() => onRefreshPlayback(recording)}
                                >
                                    <RefreshCw size={15} />
                                    {refreshing ? 'Checking playback...' : 'Refresh playback'}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.metaGrid} aria-label="Recording details">
                    <article>
                        <span>Duration</span>
                        <strong>{recording.duration}</strong>
                    </article>
                    <article>
                        <span>Status</span>
                        <strong>{recording.status}</strong>
                    </article>
                    <article>
                        <span>Storage</span>
                        <strong>{recording.size}</strong>
                    </article>
                    <article>
                        <span>Recorded by</span>
                        <strong>{recording.owner}</strong>
                    </article>
                </div>

                <footer className={styles.footer}>
                    <div className={styles.securityNote}>
                        <ShieldCheck size={16} />
                        <span>Access is checked before metadata is loaded.</span>
                    </div>
                    <div className={styles.actions}>
                        {recording.playbackUrl && (
                            <a href={recording.playbackUrl} target="_blank" rel="noreferrer">
                                <Download size={15} />
                                Open source
                            </a>
                        )}
                        <button type="button" onClick={() => onShare(recording)}>
                            <Share2 size={15} />
                            Share
                        </button>
                        <span>
                            <LockKeyhole size={14} />
                            Protected
                        </span>
                    </div>
                </footer>
            </section>
        </div>
    );
}
