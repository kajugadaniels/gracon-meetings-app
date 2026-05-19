/**
 * Members panel for the static meeting room.
 */
import { Mic, MicOff, ShieldCheck, Video, VideoOff } from 'lucide-react';
import type { MeetingRoomAttendeeView } from '@/lib/meetings/static-meetings';
import styles from './meeting-members-panel.module.css';

interface MeetingMembersPanelProps {
    attendees: MeetingRoomAttendeeView[];
    attendeeCount: number;
    muted: boolean;
    cameraOff: boolean;
    onToggleMute: () => void;
    onToggleCamera: () => void;
}

/**
 * Returns a stable visual status for the static meeting member list.
 */
function getMemberStatus(index: number) {
    if (index === 0) return 'Speaking';
    if (index % 4 === 0) return 'Muted';
    if (index % 3 === 0) return 'Camera off';
    return 'Connected';
}

/**
 * Renders a compact in-room member list without duplicating the parent tab title.
 */
export function MeetingMembersPanel({
    attendees,
    attendeeCount,
    muted,
    cameraOff,
    onToggleMute,
    onToggleCamera,
}: MeetingMembersPanelProps) {
    const visibleAttendees = attendees.slice(0, 8);

    return (
        <section className={styles.panel}>
            <div className={styles.summaryCard}>
                <div>
                    <span className={styles.summaryLabel}>In this room</span>
                    <strong>{attendeeCount} participants</strong>
                </div>
                <span className={styles.trustPill}>
                    <ShieldCheck size={13} />
                    Verified
                </span>
            </div>

            <div className={styles.memberList}>
                {visibleAttendees.map((attendee, index) => {
                    const isLocalUser = index === 0;

                    return (
                    <article
                        key={attendee.email}
                        className={`${styles.memberItem} ${isLocalUser ? styles.activeMember : ''}`}
                    >
                        <span className={styles.avatar}>{attendee.initials}</span>
                        <div>
                            <div className={styles.memberNameRow}>
                                <strong>{attendee.name}</strong>
                                <small>
                                    {isLocalUser
                                        ? `${muted ? 'Muted' : 'Mic on'} · ${cameraOff ? 'Camera off' : 'Camera on'}`
                                        : getMemberStatus(index)}
                                </small>
                            </div>
                            <p>{attendee.role}</p>
                        </div>
                        <div className={styles.memberActions} aria-label={`${attendee.name} meeting state`}>
                            {isLocalUser ? (
                                <>
                                    <button
                                        type="button"
                                        className={!muted ? styles.memberActionActive : ''}
                                        aria-label={muted ? 'Turn microphone on' : 'Turn microphone off'}
                                        onClick={onToggleMute}
                                    >
                                        {muted ? <MicOff size={13} /> : <Mic size={13} />}
                                    </button>
                                    <button
                                        type="button"
                                        className={!cameraOff ? styles.memberActionActive : ''}
                                        aria-label={cameraOff ? 'Turn camera on' : 'Turn camera off'}
                                        onClick={onToggleCamera}
                                    >
                                        {cameraOff ? <VideoOff size={13} /> : <Video size={13} />}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span title={index % 4 === 0 ? 'Muted' : 'Microphone available'}>
                                        <MicOff size={13} />
                                    </span>
                                    <span title={index % 3 === 0 ? 'Camera off' : 'Camera available'}>
                                        <Video size={13} />
                                    </span>
                                </>
                            )}
                        </div>
                    </article>
                    );
                })}
            </div>

            {attendeeCount > visibleAttendees.length && (
                <p className={styles.remainingCount}>
                    +{attendeeCount - visibleAttendees.length} more participants are connected.
                </p>
            )}
        </section>
    );
}
