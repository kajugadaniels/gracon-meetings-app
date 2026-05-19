/**
 * Custom Gracon meeting room surface with optional Stream-backed live media.
 */
'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ParticipantView,
    ParticipantsAudio,
    StreamCall,
    StreamVideo,
    StreamVideoClient,
    useCallStateHooks,
    type Call,
    type StreamVideoParticipant,
} from '@stream-io/video-react-sdk';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSessionUser, type SessionUser } from '@/app/(protected)/layout';
import {
    endMeeting,
    getMeeting,
    issueMeetingStreamToken,
    startMeetingRecording,
    stopMeetingRecording,
} from '@/lib/meetings/api-client';
import {
    createMeetingRoomView,
    type MeetingRoomHostProfile,
    MeetingRoomAttendeeView,
    MeetingRoomView,
} from '@/lib/meetings/meeting-view-models';
import type { Meeting } from '@/lib/meetings/types';
import { toast } from '@/components/ui';
import { MeetingCollaborationPanel } from './MeetingCollaborationPanel';
import { MeetingControlDock } from './MeetingControlDock';
import { MeetingEndedState } from './MeetingEndedState';
import { MeetingInviteDialog } from './MeetingInviteDialog';
import { MeetingRoomHeader } from './MeetingRoomHeader';
import { MeetingRoomNotice } from './MeetingRoomNotice';
import { MeetingSettingsDialog } from './MeetingSettingsDialog';
import { MeetingShortcutsDialog } from './MeetingShortcutsDialog';
import { MeetingStage } from './MeetingStage';
import { RecordingStopDialog } from './RecordingStopDialog';
import { EndMeetingDialog } from './EndMeetingDialog';
import type { CollaborationPanel, RoomMessage, StageParticipant } from './meeting-room-types';
import styles from './meeting-room.module.css';

interface MeetingRoomProps {
    meetingId: string;
}

interface StreamSession {
    client: StreamVideoClient;
    call: Call;
}

interface RoomExperienceProps {
    meeting: MeetingRoomView;
    attendees: MeetingRoomAttendeeView[];
    attendeeCount: number;
    stageParticipants: StageParticipant[];
    muted: boolean;
    cameraOff: boolean;
    sharingScreen: boolean;
    roomNotice?: string | null;
    renderParticipantMedia: (participant: StageParticipant) => ReactNode;
    onToggleMute: () => void | Promise<void>;
    onToggleCamera: () => void | Promise<void>;
    onToggleScreenShare: () => void | Promise<void>;
}

/**
 * Detects editable targets so room keyboard shortcuts do not hijack chat typing.
 */
function isEditableShortcutTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;

    return target.closest('input, textarea, select, [contenteditable="true"]') !== null;
}

const STREAM_TRACK_TYPE_AUDIO = 1;
const STREAM_TRACK_TYPE_VIDEO = 2;
const STREAM_TRACK_TYPE_SCREEN_SHARE = 3;

/**
 * Detects API-backed meeting ids so local-only rooms do not call Stream.
 */
function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Stops every track in a local browser media stream.
 */
function stopMediaStream(stream: MediaStream | null) {
    stream?.getTracks().forEach((track) => track.stop());
}

/**
 * Builds a stable initials fallback for participants without profile images.
 */
function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'GM';
}

/**
 * Returns the current local time label for room chat messages.
 */
function getCurrentTimeLabel() {
    return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(new Date());
}

/**
 * Resolves the current authenticated user's display name for room ownership.
 */
function getSessionDisplayName(user: SessionUser): string {
    return `${user.postNames} ${user.surName}`.trim() || user.email;
}

/**
 * Converts the authenticated user into the room host profile contract.
 */
function getRoomHostProfile(user: SessionUser): MeetingRoomHostProfile {
    return {
        userId: user.userId,
        email: user.email,
        displayName: getSessionDisplayName(user),
    };
}

/**
 * Formats an elapsed duration for compact in-room recording controls.
 */
function formatElapsedTime(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');

    if (hours > 0) {
        return `${hours}:${paddedMinutes}:${paddedSeconds}`;
    }

    return `${paddedMinutes}:${paddedSeconds}`;
}

/**
 * Checks Stream's numeric published-track list without importing non-browser enum exports.
 */
function hasPublishedTrack(participant: StreamVideoParticipant | undefined, trackType: number) {
    return participant?.publishedTracks.some(
        (publishedTrack) => Number(publishedTrack) === trackType,
    ) ?? false;
}

/**
 * Collapses duplicate Stream sessions for the same Gracon user before rendering.
 */
function getUniqueStreamParticipants(participants: StreamVideoParticipant[]) {
    const byUserId = new Map<string, StreamVideoParticipant>();

    participants.forEach((participant) => {
        const key = getStreamParticipantStableKey(participant);
        const current = byUserId.get(key);

        if (!current) {
            byUserId.set(key, participant);
            return;
        }

        if (getStreamParticipantScore(participant) > getStreamParticipantScore(current)) {
            byUserId.set(key, participant);
        }
    });

    return Array.from(byUserId.values());
}

/**
 * Builds a stable stage key that collapses duplicate browser sessions for one person.
 */
function getStreamParticipantStableKey(participant: StreamVideoParticipant) {
    const normalizedName = participant.name?.trim().toLowerCase();

    // Stream can briefly expose the same browser user as both local and remote-like
    // sessions during reconnects. User identity must win over session identity so
    // one host cannot render as two different participants.
    return participant.userId || normalizedName || participant.sessionId;
}

/**
 * Scores duplicate Stream sessions so the richest active media tile is retained.
 */
function getStreamParticipantScore(participant: StreamVideoParticipant) {
    let score = 0;

    if (hasPublishedTrack(participant, STREAM_TRACK_TYPE_SCREEN_SHARE)) score += 8;
    if (hasPublishedTrack(participant, STREAM_TRACK_TYPE_VIDEO)) score += 5;
    if (participant.isDominantSpeaker) score += 3;
    if (participant.isSpeaking) score += 2;
    if (participant.isLocalParticipant) score += 1;

    return score;
}

/**
 * Returns visible local participants using the authenticated host as the active speaker.
 */
function getLocalStageParticipants(meeting: MeetingRoomView): StageParticipant[] {
    const hostParticipant: StageParticipant = {
        initials: getInitials(meeting.hostName),
        name: meeting.hostName,
        role: 'Speaking · Host',
        speaking: true,
    };

    const otherParticipants = meeting.attendees
        .filter((attendee) => attendee.name !== meeting.hostName)
        .slice(0, 3)
        .map<StageParticipant>((attendee, index) => ({
            initials: attendee.initials,
            name: attendee.name,
            role: index % 2 === 0 ? 'Listening' : attendee.role,
            speaking: false,
        }));

    return [hostParticipant, ...otherParticipants].slice(0, 4);
}

/**
 * Converts Stream participants into the custom stage model used by Gracon UI.
 */
function getStreamStageParticipants(
    participants: StreamVideoParticipant[],
    meeting: MeetingRoomView,
): StageParticipant[] {
    if (participants.length === 0) {
        return getLocalStageParticipants(meeting);
    }

    const screenSharingParticipant = participants.find((participant) => (
        hasPublishedTrack(participant, STREAM_TRACK_TYPE_SCREEN_SHARE)
    ));
    const screenShareTile: StageParticipant[] = screenSharingParticipant
        ? [{
            initials: getInitials(screenSharingParticipant.name || screenSharingParticipant.userId),
            name: `${screenSharingParticipant.name || screenSharingParticipant.userId} screen`,
            role: screenSharingParticipant.isLocalParticipant ? 'Sharing your screen' : 'Sharing screen',
            speaking: true,
            hasVideo: true,
            trackType: 'screenShareTrack',
            streamParticipant: screenSharingParticipant,
        }]
        : [];

    const participantTiles = participants
        .slice(0, 4)
        .map((participant, index) => {
            const name = participant.name || participant.userId || `Participant ${index + 1}`;
            const speaking = !screenSharingParticipant
                && (participant.isSpeaking || participant.isDominantSpeaker || index === 0);
            const hasVideo = hasPublishedTrack(participant, STREAM_TRACK_TYPE_VIDEO);

            return {
                initials: getInitials(name),
                name,
                role: speaking
                    ? participant.isLocalParticipant ? 'Speaking · You' : 'Speaking'
                    : participant.isLocalParticipant ? 'You' : 'Listening',
                speaking,
                hasVideo,
                trackType: 'videoTrack' as const,
                streamParticipant: participant,
            };
        });

    return [...screenShareTile, ...participantTiles].slice(0, 4);
}

/**
 * Converts Stream presence into member-panel attendees while preserving local fallbacks.
 */
function getStreamAttendees(
    participants: StreamVideoParticipant[],
    meeting: MeetingRoomView,
): MeetingRoomAttendeeView[] {
    if (participants.length === 0) return meeting.attendees;

    return participants.map((participant, index) => {
        const name = participant.name || participant.userId || `Participant ${index + 1}`;

        return {
            initials: getInitials(name),
            name,
            email: `${participant.userId || `participant-${index + 1}`}@meeting.local`,
            role: participant.isLocalParticipant ? 'You' : participant.roles[0] ?? 'Participant',
        };
    });
}

/**
 * Initializes the Stream client and joins the call only for persisted API meetings.
 */
function useStreamSession(meeting: MeetingRoomView) {
    const [session, setSession] = useState<StreamSession | null>(null);
    const [loading, setLoading] = useState(isUuid(meeting.id));
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isUuid(meeting.id)) {
            return undefined;
        }

        let cancelled = false;
        let nextSession: StreamSession | null = null;

        async function connect() {
            setLoading(true);
            setError(null);

            try {
                const access = await issueMeetingStreamToken(meeting.id);
                const client = StreamVideoClient.getOrCreateInstance({
                    apiKey: access.apiKey,
                    user: {
                        id: access.userId,
                        name: meeting.hostName,
                    },
                    token: access.token,
                });
                const call = client.call(access.callType, access.callId);

                await call.join({
                    create: false,
                    joinResponseTimeout: 10000,
                });

                // Start muted with camera off so joining a room never leaks media unexpectedly.
                await Promise.allSettled([
                    call.microphone.disable(true),
                    call.camera.disable(true),
                ]);

                nextSession = { client, call };

                if (!cancelled) {
                    setSession(nextSession);
                }
            } catch {
                setError('Live media is unavailable right now. You can still review the room layout.');
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void connect();

        return () => {
            cancelled = true;
            const cleanupSession = nextSession;
            cleanupSession?.call.leave().catch(() => undefined);
            cleanupSession?.client.disconnectUser().catch(() => undefined);
        };
    }, [meeting.hostName, meeting.id]);

    return { session, loading, error };
}

/**
 * Renders a local browser-media fallback for non-persisted rooms and Stream failures.
 */
function LocalMeetingRoom({ meeting, roomNotice }: { meeting: MeetingRoomView; roomNotice?: string | null }) {
    const [muted, setMuted] = useState(true);
    const [cameraOff, setCameraOff] = useState(true);
    const [sharingScreen, setSharingScreen] = useState(false);
    const [mediaError, setMediaError] = useState<string | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const videoStreamRef = useRef<MediaStream | null>(null);
    const screenShareStreamRef = useRef<MediaStream | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const screenShareVideoRef = useRef<HTMLVideoElement | null>(null);
    const localParticipants = getLocalStageParticipants(meeting);
    const stageParticipants: StageParticipant[] = sharingScreen
        ? [
            {
                initials: getInitials(meeting.hostName),
                name: `${meeting.hostName} screen`,
                role: 'Sharing your screen',
                speaking: true,
                hasVideo: true,
                trackType: 'screenShareTrack' as const,
            },
            ...localParticipants.map((participant) => ({
                ...participant,
                speaking: false,
                role: participant.name === meeting.hostName ? 'Host' : participant.role,
            })),
        ].slice(0, 4)
        : localParticipants;

    useEffect(() => {
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = cameraOff ? null : videoStreamRef.current;
        }
    }, [cameraOff]);

    useEffect(() => {
        if (screenShareVideoRef.current) {
            screenShareVideoRef.current.srcObject = sharingScreen
                ? screenShareStreamRef.current
                : null;
        }
    }, [sharingScreen]);

    useEffect(() => () => {
        stopMediaStream(audioStreamRef.current);
        stopMediaStream(videoStreamRef.current);
        stopMediaStream(screenShareStreamRef.current);
    }, []);

    /**
     * Requests or stops the local microphone track for non-Stream fallback rooms.
     */
    async function handleToggleMute() {
        setMediaError(null);

        if (!muted) {
            stopMediaStream(audioStreamRef.current);
            audioStreamRef.current = null;
            setMuted(true);
            toast.info('Microphone muted');
            return;
        }

        try {
            audioStreamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false,
            });
            setMuted(false);
            toast.success('Microphone enabled');
        } catch {
            const message = 'Microphone permission was blocked or unavailable.';
            setMediaError(message);
            toast.error('Microphone unavailable', { description: message });
        }
    }

    /**
     * Requests or stops the local camera track for non-Stream fallback rooms.
     */
    async function handleToggleCamera() {
        setMediaError(null);

        if (!cameraOff) {
            stopMediaStream(videoStreamRef.current);
            videoStreamRef.current = null;
            setCameraOff(true);
            toast.info('Camera stopped');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user',
                },
            });
            videoStreamRef.current = stream;
            setCameraOff(false);
            toast.success('Camera started');
        } catch {
            const message = 'Camera permission was blocked or unavailable.';
            setMediaError(message);
            toast.error('Camera unavailable', { description: message });
        }
    }

    /**
     * Requests or stops browser screen capture for local fallback rooms.
     */
    async function handleToggleScreenShare() {
        setMediaError(null);

        if (sharingScreen) {
            stopMediaStream(screenShareStreamRef.current);
            screenShareStreamRef.current = null;
            setSharingScreen(false);
            toast.info('Screen sharing stopped');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false,
            });
            const [track] = stream.getVideoTracks();
            track?.addEventListener('ended', () => {
                screenShareStreamRef.current = null;
                setSharingScreen(false);
                toast.info('Screen sharing stopped');
            });
            screenShareStreamRef.current = stream;
            setSharingScreen(true);
            toast.success('Screen sharing started');
        } catch {
            const message = 'Screen sharing permission was blocked or unavailable.';
            setMediaError(message);
            toast.error('Screen sharing unavailable', { description: message });
        }
    }

    return (
        <RoomExperience
            meeting={meeting}
            attendees={meeting.attendees}
            attendeeCount={meeting.attendeeCount}
            stageParticipants={stageParticipants}
            muted={muted}
            cameraOff={cameraOff}
            sharingScreen={sharingScreen}
            roomNotice={mediaError ?? roomNotice}
            renderParticipantMedia={(participant) => (
                participant.trackType === 'screenShareTrack' ? (
                    <video
                        ref={screenShareVideoRef}
                        className={styles.localScreenShareVideo}
                        autoPlay
                        muted
                        playsInline
                    />
                ) : participant.speaking && !cameraOff ? (
                    <video
                        ref={localVideoRef}
                        className={styles.localVideo}
                        autoPlay
                        muted
                        playsInline
                    />
                ) : (
                    <span className={styles.videoAvatar}>{participant.initials}</span>
                )
            )}
            onToggleMute={handleToggleMute}
            onToggleCamera={handleToggleCamera}
            onToggleScreenShare={handleToggleScreenShare}
        />
    );
}

/**
 * Renders the custom Gracon room while sourcing presence and media from Stream.
 */
function StreamMeetingRoom({ meeting, call }: { meeting: MeetingRoomView; call: Call }) {
    const {
        useLocalParticipant,
        useParticipantCount,
        useParticipants,
        useRemoteParticipants,
    } = useCallStateHooks();
    const participants = useParticipants();
    const remoteParticipants = useRemoteParticipants();
    const localParticipant = useLocalParticipant();
    const rawParticipantCount = useParticipantCount();
    const visibleParticipants = getUniqueStreamParticipants(participants);
    const remoteAudioParticipants = getUniqueStreamParticipants(remoteParticipants)
        .filter((participant) => (
            !participant.isLocalParticipant
            && participant.userId !== localParticipant?.userId
        ));
    const muted = !hasPublishedTrack(localParticipant, STREAM_TRACK_TYPE_AUDIO);
    const cameraOff = !hasPublishedTrack(localParticipant, STREAM_TRACK_TYPE_VIDEO);
    const sharingScreen = hasPublishedTrack(localParticipant, STREAM_TRACK_TYPE_SCREEN_SHARE);
    const stageParticipants = getStreamStageParticipants(visibleParticipants, meeting);
    const attendees = getStreamAttendees(visibleParticipants, meeting);
    const participantCount = visibleParticipants.length || rawParticipantCount;

    /**
     * Toggles Stream microphone publishing after Gracon token checks have passed.
     */
    async function handleToggleMute() {
        try {
            if (muted) {
                await call.microphone.enable();
                toast.success('Microphone enabled');
            } else {
                await call.microphone.disable();
                toast.info('Microphone muted');
            }
        } catch {
            toast.error('Microphone unavailable', {
                description: 'The live provider could not update your microphone.',
            });
        }
    }

    /**
     * Toggles Stream camera publishing after Gracon token checks have passed.
     */
    async function handleToggleCamera() {
        try {
            if (cameraOff) {
                await call.camera.enable();
                toast.success('Camera started');
            } else {
                await call.camera.disable();
                toast.info('Camera stopped');
            }
        } catch {
            toast.error('Camera unavailable', {
                description: 'The live provider could not update your camera.',
            });
        }
    }

    /**
     * Toggles Stream screen sharing while keeping the custom Gracon room surface.
     */
    async function handleToggleScreenShare() {
        try {
            if (sharingScreen) {
                await call.screenShare.disable();
                toast.info('Screen sharing stopped');
            } else {
                await call.screenShare.enable();
                toast.success('Screen sharing started');
            }
        } catch {
            toast.error('Screen sharing unavailable', {
                description: 'The live provider could not update screen sharing.',
            });
        }
    }

    return (
        <>
            {remoteAudioParticipants.length > 0 && (
                <ParticipantsAudio participants={remoteAudioParticipants} />
            )}
            <RoomExperience
                meeting={meeting}
                attendees={attendees}
                attendeeCount={Math.max(participantCount, attendees.length)}
                stageParticipants={stageParticipants}
                muted={muted}
                cameraOff={cameraOff}
                sharingScreen={sharingScreen}
                renderParticipantMedia={(participant) => (
                    participant.streamParticipant && participant.hasVideo ? (
                        <ParticipantView
                            participant={participant.streamParticipant}
                            trackType={participant.trackType ?? 'videoTrack'}
                            muteAudio
                            ParticipantViewUI={null}
                            className={styles.streamParticipantView}
                        />
                    ) : (
                        <span className={styles.videoAvatar}>{participant.initials}</span>
                    )
                )}
                onToggleMute={handleToggleMute}
                onToggleCamera={handleToggleCamera}
                onToggleScreenShare={handleToggleScreenShare}
            />
        </>
    );
}

/**
 * Renders the shared custom room chrome used by both Stream and fallback rooms.
 */
function RoomExperience({
    meeting,
    attendees,
    attendeeCount,
    stageParticipants,
    muted,
    cameraOff,
    sharingScreen,
    roomNotice,
    renderParticipantMedia,
    onToggleMute,
    onToggleCamera,
    onToggleScreenShare,
}: RoomExperienceProps) {
    const [recording, setRecording] = useState(false);
    const [recordingBusy, setRecordingBusy] = useState(false);
    const [recordingStopOpen, setRecordingStopOpen] = useState(false);
    const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
    const [recordingElapsedSeconds, setRecordingElapsedSeconds] = useState(0);
    const [handRaised, setHandRaised] = useState(false);
    const [activePanel, setActivePanel] = useState<CollaborationPanel | null>(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const [endDialogOpen, setEndDialogOpen] = useState(false);
    const [ended, setEnded] = useState(false);
    const [ending, setEnding] = useState(false);
    const [endError, setEndError] = useState<string | null>(null);
    const [messages, setMessages] = useState<RoomMessage[]>([]);
    const recordingElapsedLabel = formatElapsedTime(recordingElapsedSeconds);

    useEffect(() => {
        if (!recording || recordingStartedAt === null) return undefined;

        const intervalId = window.setInterval(() => {
            setRecordingElapsedSeconds(Math.floor((Date.now() - recordingStartedAt) / 1000));
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [recording, recordingStartedAt]);

    useEffect(() => {
        function handleRoomShortcut(event: KeyboardEvent) {
            if (isEditableShortcutTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) {
                return;
            }

            const shortcut = event.key.toLowerCase();

            if (shortcut === 'escape') {
                setActivePanel(null);
                setInviteOpen(false);
                setSettingsOpen(false);
                setShortcutsOpen(false);
                setEndDialogOpen(false);
                setRecordingStopOpen(false);
                return;
            }

            if (shortcut === 'm') {
                event.preventDefault();
                void onToggleMute();
                return;
            }

            if (shortcut === 'v') {
                event.preventDefault();
                void onToggleCamera();
                return;
            }

            if (shortcut === 's') {
                event.preventDefault();
                void onToggleScreenShare();
                return;
            }

            if (shortcut === 'h') {
                event.preventDefault();
                handleToggleRaiseHand();
                return;
            }

            if (shortcut === 'r') {
                event.preventDefault();
                handleRecordingRequest();
            }
        }

        window.addEventListener('keydown', handleRoomShortcut);

        return () => window.removeEventListener('keydown', handleRoomShortcut);
    });

    /**
     * Opens the requested collaboration panel or closes it when selected twice.
     */
    function openPanel(panel: CollaborationPanel) {
        setActivePanel((currentPanel) => (currentPanel === panel ? null : panel));
    }

    /**
     * Ends persisted meetings, while keeping local fallback rooms usable.
     */
    async function handleEndMeeting() {
        if (ending) return;

        setEnding(true);
        setEndError(null);

        try {
            if (isUuid(meeting.id)) {
                await endMeeting(meeting.id);
            }

            setEnded(true);
            setEndDialogOpen(false);
            toast.success('Meeting ended', {
                description: 'This room is now closed for everyone.',
            });
        } catch (err) {
            const message = err instanceof Error
                ? err.message
                : 'Unable to end this meeting right now.';
            setEndError(message);
            toast.error('Meeting could not be ended', { description: message });
        } finally {
            setEnding(false);
        }
    }

    /**
     * Starts or stops recording through api/meetings when the room is persisted.
     */
    async function handleToggleRecording(): Promise<boolean> {
        if (recordingBusy) return false;

        setRecordingBusy(true);
        setEndError(null);

        try {
            if (isUuid(meeting.id)) {
                const result = recording
                    ? await stopMeetingRecording(meeting.id)
                    : await startMeetingRecording(meeting.id);

                const nextRecording = !recording;
                setRecording(nextRecording);
                setRecordingStartedAt(nextRecording ? Date.now() : null);
                setRecordingElapsedSeconds(0);
                toast.success(
                    result.status === 'PROCESSING' ? 'Recording stopped' : 'Recording started',
                    {
                        description: result.status === 'PROCESSING'
                            ? 'The meeting file is processing before it appears in recordings.'
                            : 'Recording evidence is now being audit logged.',
                    },
                );
            } else {
                const nextRecording = !recording;
                setRecording(nextRecording);
                setRecordingStartedAt(nextRecording ? Date.now() : null);
                setRecordingElapsedSeconds(0);
                toast.success(
                    recording ? 'Recording stopped' : 'Recording started',
                    {
                        description: recording
                            ? 'The local preview recording is now stopped.'
                            : 'The local preview recording timer has started.',
                    },
                );
            }

            return true;
        } catch (err) {
            const message = err instanceof Error
                ? err.message
                : 'Unable to update recording right now.';
            setEndError(message);
            toast.error('Recording update failed', { description: message });
            return false;
        } finally {
            setRecordingBusy(false);
        }
    }

    /**
     * Guards against accidental recording stops by requiring confirmation first.
     */
    function handleRecordingRequest() {
        if (recording) {
            setRecordingStopOpen(true);
            return;
        }

        void handleToggleRecording();
    }

    /**
     * Stops recording only after the user confirms the destructive room action.
     */
    async function handleConfirmStopRecording() {
        const stopped = await handleToggleRecording();

        if (stopped) {
            setRecordingStopOpen(false);
        }
    }

    /**
     * Toggles the local raised-hand state and surfaces it in the room chrome.
     */
    function handleToggleRaiseHand() {
        setHandRaised((value) => {
            const nextValue = !value;
            toast.info(nextValue ? 'Hand raised' : 'Hand lowered');
            return nextValue;
        });
    }

    /**
     * Stores custom-room chat messages above the panel so tab switches do not lose them.
     */
    function handleSendMessage(body: string) {
        setMessages((currentMessages) => [
            ...currentMessages,
            {
                sender: 'You',
                body,
                time: getCurrentTimeLabel(),
            },
        ]);
    }

    if (ended) {
        return <MeetingEndedState title={meeting.title} />;
    }

    return (
        <section className={styles.room}>
            <MeetingRoomHeader
                meeting={meeting}
                attendeeCount={attendeeCount}
                muted={muted}
                cameraOff={cameraOff}
                sharingScreen={sharingScreen}
                recording={recording}
                recordingElapsedLabel={recordingElapsedLabel}
                handRaised={handRaised}
                onInvite={() => setInviteOpen(true)}
            />

            {(endError || roomNotice) && (
                <MeetingRoomNotice
                    tone={endError ? 'error' : 'info'}
                    message={endError ?? roomNotice ?? ''}
                />
            )}

            <motion.div
                layout
                className={`${styles.stageLayout} ${activePanel ? styles.stageLayoutWithPanel : ''}`}
            >
                <MeetingStage
                    participants={stageParticipants}
                    recording={recording}
                    recordingElapsedLabel={recordingElapsedLabel}
                    muted={muted}
                    handRaised={handRaised}
                    hostName={meeting.hostName}
                    renderParticipantMedia={renderParticipantMedia}
                />

                <AnimatePresence initial={false}>
                    {activePanel && (
                        <MeetingCollaborationPanel
                            key="meeting-collaboration-panel"
                            activePanel={activePanel}
                            attendees={attendees}
                            attendeeCount={attendeeCount}
                            muted={muted}
                            cameraOff={cameraOff}
                            messages={messages}
                            onToggleMute={onToggleMute}
                            onToggleCamera={onToggleCamera}
                            onSendMessage={handleSendMessage}
                            onChangePanel={setActivePanel}
                            onClose={() => setActivePanel(null)}
                        />
                    )}
                </AnimatePresence>
            </motion.div>

            <MeetingControlDock
                muted={muted}
                cameraOff={cameraOff}
                recording={recording}
                recordingBusy={recordingBusy}
                recordingElapsedLabel={recording ? recordingElapsedLabel : undefined}
                sharingScreen={sharingScreen}
                handRaised={handRaised}
                activePanel={activePanel}
                onToggleMute={() => void onToggleMute()}
                onToggleCamera={() => void onToggleCamera()}
                onToggleScreenShare={() => void onToggleScreenShare()}
                onToggleRecording={handleRecordingRequest}
                onToggleRaiseHand={handleToggleRaiseHand}
                onToggleMembers={() => openPanel('members')}
                onToggleChat={() => openPanel('chat')}
                onOpenSettings={() => setSettingsOpen(true)}
                onOpenShortcuts={() => setShortcutsOpen(true)}
                ending={ending}
                onEndMeeting={() => setEndDialogOpen(true)}
            />

            {inviteOpen && (
                <MeetingInviteDialog
                    meetingId={meeting.id}
                    attendees={attendees}
                    onClose={() => setInviteOpen(false)}
                />
            )}

            {settingsOpen && (
                <MeetingSettingsDialog
                    muted={muted}
                    cameraOff={cameraOff}
                    onToggleMute={() => void onToggleMute()}
                    onToggleCamera={() => void onToggleCamera()}
                    onClose={() => setSettingsOpen(false)}
                />
            )}

            {recordingStopOpen && (
                <RecordingStopDialog
                    elapsedLabel={recordingElapsedLabel}
                    busy={recordingBusy}
                    onConfirm={() => void handleConfirmStopRecording()}
                    onClose={() => setRecordingStopOpen(false)}
                />
            )}

            {endDialogOpen && (
                <EndMeetingDialog
                    attendeeCount={attendeeCount}
                    recording={recording}
                    recordingElapsedLabel={recordingElapsedLabel}
                    ending={ending}
                    onConfirm={() => void handleEndMeeting()}
                    onClose={() => setEndDialogOpen(false)}
                />
            )}

            {shortcutsOpen && (
                <MeetingShortcutsDialog onClose={() => setShortcutsOpen(false)} />
            )}
        </section>
    );
}

/**
 * Renders the meeting room with Stream presence for persisted meetings and local media fallback.
 */
export function MeetingRoom({ meetingId }: MeetingRoomProps) {
    const user = useSessionUser();
    const hostProfile = useMemo(() => (
        user ? getRoomHostProfile(user) : null
    ), [user]);
    const [persistedMeeting, setPersistedMeeting] = useState<Meeting | null>(null);
    const [meetingLoading, setMeetingLoading] = useState(isUuid(meetingId));
    const [meetingError, setMeetingError] = useState<string | null>(null);

    useEffect(() => {
        const currentUrl = new URL(window.location.href);
        if (!currentUrl.searchParams.has('title')) return;

        // Legacy room links carried mutable display names in the URL. Strip the
        // parameter in place so only API/session data can identify the room host.
        currentUrl.searchParams.delete('title');
        window.history.replaceState(
            null,
            '',
            `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
        );
    }, []);

    const meeting = useMemo(() => (
        createMeetingRoomView(
            meetingId,
            hostProfile ?? {
                userId: '',
                email: '',
                displayName: 'Loading host',
            },
            persistedMeeting,
        )
    ), [hostProfile, meetingId, persistedMeeting]);
    const { session, loading, error } = useStreamSession(meeting);

    useEffect(() => {
        if (!hostProfile || !isUuid(meetingId)) {
            return undefined;
        }

        let cancelled = false;

        async function loadMeeting() {
            setMeetingLoading(true);
            setMeetingError(null);

            try {
                const persistedMeeting = await getMeeting(meetingId);
                if (cancelled) return;

                setPersistedMeeting(persistedMeeting);
            } catch (err) {
                if (cancelled) return;
                setMeetingError(
                    err instanceof Error
                        ? err.message
                        : 'Unable to load meeting details.',
                );
            } finally {
                if (!cancelled) setMeetingLoading(false);
            }
        }

        void loadMeeting();

        return () => {
            cancelled = true;
        };
    }, [
        hostProfile,
        meetingId,
    ]);

    const roomNotice = meetingLoading
        ? 'Loading meeting details...'
        : meetingError ?? (loading ? 'Preparing secure live media...' : error);

    if (session) {
        return (
            <StreamVideo client={session.client}>
                <StreamCall call={session.call}>
                    <StreamMeetingRoom meeting={meeting} call={session.call} />
                </StreamCall>
            </StreamVideo>
        );
    }

    return (
        <LocalMeetingRoom
            meeting={meeting}
            roomNotice={roomNotice}
        />
    );
}
