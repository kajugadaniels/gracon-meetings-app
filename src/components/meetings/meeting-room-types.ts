/**
 * Shared custom meeting room view contracts.
 */
import type { ReactNode } from 'react';
import type { StreamVideoParticipant } from '@stream-io/video-react-sdk';

export type CollaborationPanel = 'members' | 'chat';

export interface RoomMessage {
    sender: string;
    body: string;
    time: string;
}

export interface StageParticipant {
    initials: string;
    name: string;
    role: string;
    speaking: boolean;
    hasVideo?: boolean;
    trackType?: 'videoTrack' | 'screenShareTrack';
    streamParticipant?: StreamVideoParticipant;
}

export interface MeetingStageProps {
    participants: StageParticipant[];
    recording: boolean;
    recordingElapsedLabel: string;
    muted: boolean;
    handRaised: boolean;
    hostName: string;
    renderParticipantMedia: (participant: StageParticipant) => ReactNode;
}
