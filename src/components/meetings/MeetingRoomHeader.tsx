/**
 * Premium live-room header with status chips and invite entry point.
 */
'use client';

import {
    Circle,
    Hand,
    LockKeyhole,
    Mic,
    MicOff,
    MonitorUp,
    UserPlus,
    UsersRound,
    Video,
    VideoOff,
} from 'lucide-react';
import type { MeetingRoomView } from '@/lib/meetings/static-meetings';
import styles from './meeting-room-header.module.css';

interface MeetingRoomHeaderProps {
    meeting: MeetingRoomView;
    attendeeCount: number;
    muted: boolean;
    cameraOff: boolean;
    sharingScreen: boolean;
    recording: boolean;
    recordingElapsedLabel: string;
    handRaised: boolean;
    onInvite: () => void;
}

/**
 * Renders room identity, trust state, media state, and invite action in one stable header.
 */
export function MeetingRoomHeader({
    meeting,
    attendeeCount,
    muted,
    cameraOff,
    sharingScreen,
    recording,
    recordingElapsedLabel,
    handRaised,
    onInvite,
}: MeetingRoomHeaderProps) {
    return (
        <header className={styles.header}>
            <div className={styles.identity}>
                <p className={styles.eyebrow}>Live meeting room</p>
                <h1>{meeting.title}</h1>
                <p>{meeting.date} · {meeting.time} · Hosted by {meeting.hostName}</p>
            </div>

            <div className={styles.statusCluster} aria-label="Meeting status">
                <span className={styles.statusPill}>
                    <LockKeyhole size={13} />
                    Secure room
                </span>
                <span className={styles.statusPill}>
                    <UsersRound size={13} />
                    {attendeeCount} joined
                </span>
                <span className={styles.statusPill}>
                    {muted ? <MicOff size={13} /> : <Mic size={13} />}
                    {muted ? 'Muted' : 'Mic on'}
                </span>
                <span className={styles.statusPill}>
                    {cameraOff ? <VideoOff size={13} /> : <Video size={13} />}
                    {cameraOff ? 'Camera off' : 'Camera on'}
                </span>
                {sharingScreen && (
                    <span className={styles.statusPill}>
                        <MonitorUp size={13} />
                        Sharing
                    </span>
                )}
                {recording && (
                    <span className={`${styles.statusPill} ${styles.recordingPill}`}>
                        <Circle size={8} fill="currentColor" />
                        Rec {recordingElapsedLabel}
                    </span>
                )}
                {handRaised && (
                    <span className={styles.statusPill}>
                        <Hand size={13} />
                        Hand raised
                    </span>
                )}
                <button type="button" className={styles.inviteButton} onClick={onInvite}>
                    <UserPlus size={15} />
                    Invite
                </button>
            </div>
        </header>
    );
}
