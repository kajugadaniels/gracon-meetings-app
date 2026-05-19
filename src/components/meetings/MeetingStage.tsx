/**
 * Participant stage renderer for the custom Gracon meeting room.
 */
import { Circle, Hand } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MeetingStageProps } from './meeting-room-types';
import styles from './meeting-room.module.css';

/**
 * Renders the adaptive stage grid and all participant tiles.
 */
export function MeetingStage({
    participants,
    recording,
    recordingElapsedLabel,
    muted,
    handRaised,
    hostName,
    renderParticipantMedia,
}: MeetingStageProps) {
    return (
        <motion.main layout className={styles.stage} aria-label="Meeting stage">
            <div
                className={`${styles.videoGrid} ${
                    participants.length === 1 ? styles.videoGridSingle : ''
                }`}
            >
                {participants.map((participant, index) => (
                    <motion.article
                        layout
                        key={participant.streamParticipant?.sessionId ?? `${participant.name}-${participant.role}`}
                        className={`${styles.videoTile} ${
                            participant.speaking ? styles.videoTileSpeaking : ''
                        } ${
                            participants.length === 3 && index === 2
                                ? styles.videoTileFull
                                : ''
                        }`}
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {participant.speaking && recording && (
                            <div className={styles.recordingPill}>
                                <Circle size={8} fill="currentColor" />
                                Recording {recordingElapsedLabel}
                            </div>
                        )}
                        {handRaised
                            && (participant.role.includes('You') || participant.name === hostName)
                            && (
                                <div className={styles.handRaisedPill}>
                                    <Hand size={12} />
                                    Hand raised
                                </div>
                            )}
                        {renderParticipantMedia(participant)}
                        <div className={styles.videoMeta}>
                            <strong>{participant.name}</strong>
                            <small>
                                {participant.speaking && !muted
                                    ? 'Speaking · Mic on'
                                    : participant.role}
                            </small>
                        </div>
                    </motion.article>
                ))}
            </div>
        </motion.main>
    );
}
