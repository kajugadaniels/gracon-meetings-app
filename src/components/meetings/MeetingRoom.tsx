/**
 * Custom Gracon meeting room surface with optional Stream-backed live media.
 */
'use client';

import type { ReactNode } from 'react';
import { Circle, Home, UserPlus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
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
import { useEffect, useRef, useState } from 'react';
import {
    endMeeting,
    issueMeetingStreamToken,
    startMeetingRecording,
    stopMeetingRecording,
} from '@/lib/meetings/api-client';
import type {
    MeetingRoomAttendeeView,
    MeetingRoomView,
} from '@/lib/meetings/static-meetings';
import { MeetingCollaborationPanel } from './MeetingCollaborationPanel';
import { MeetingControlDock } from './MeetingControlDock';
import { MeetingInviteDialog } from './MeetingInviteDialog';
import styles from './meeting-room.module.css';

interface MeetingRoomProps {
    meeting: MeetingRoomView;
}

interface RoomMessage {
    sender: string;
    body: string;
    time: string;
}

type CollaborationPanel = 'members' | 'chat';

interface StageParticipant {
    initials: string;
    name: string;
    role: string;
    speaking: boolean;
    hasVideo?: boolean;
    trackType?: 'videoTrack' | 'screenShareTrack';
    streamParticipant?: StreamVideoParticipant;
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

const INITIAL_MESSAGES: RoomMessage[] = [
    {
        sender: 'Olive UHIRIWE',
        body: 'Agenda is ready. I added the compliance section before the review starts.',
        time: '09:56',
    },
    {
        sender: 'Jean MUGISHA',
        body: 'I will share the document package after Daniel opens screen sharing.',
        time: '09:58',
    },
    {
        sender: 'Daniel KAJUGA',
        body: 'Thanks. Let us keep recording enabled for the decision summary.',
        time: '10:01',
    },
];
const STREAM_TRACK_TYPE_AUDIO = 1;
const STREAM_TRACK_TYPE_VIDEO = 2;
const STREAM_TRACK_TYPE_SCREEN_SHARE = 3;

/**
 * Detects API-backed meeting ids so seeded design rooms do not call Stream.
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
        const key = participant.userId || participant.sessionId;
        const current = byUserId.get(key);

        if (!current) {
            byUserId.set(key, participant);
            return;
        }

        const currentHasVideo = hasPublishedTrack(current, STREAM_TRACK_TYPE_VIDEO);
        const participantHasVideo = hasPublishedTrack(participant, STREAM_TRACK_TYPE_VIDEO);

        if (
            participant.isLocalParticipant
            || (!current.isSpeaking && participant.isSpeaking)
            || (!current.isDominantSpeaker && participant.isDominantSpeaker)
            || (!currentHasVideo && participantHasVideo)
        ) {
            byUserId.set(key, participant);
        }
    });

    return Array.from(byUserId.values());
}

/**
 * Returns the visible seeded participants using the host as the active speaker.
 */
function getStaticStageParticipants(meeting: MeetingRoomView): StageParticipant[] {
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
        return getStaticStageParticipants(meeting);
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
 * Converts Stream presence into member-panel attendees while preserving seeded fallbacks.
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
 * Initializes the Stream client and joins the call only for API-backed meetings.
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
        };
    }, [meeting.hostName, meeting.id]);

    return { session, loading, error };
}

/**
 * Renders a local browser-media fallback for seeded rooms and Stream failures.
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
    const staticParticipants = getStaticStageParticipants(meeting);
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
            ...staticParticipants.map((participant) => ({
                ...participant,
                speaking: false,
                role: participant.name === meeting.hostName ? 'Host' : participant.role,
            })),
        ].slice(0, 4)
        : staticParticipants;

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
            return;
        }

        try {
            audioStreamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false,
            });
            setMuted(false);
        } catch {
            setMediaError('Microphone permission was blocked or unavailable.');
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
        } catch {
            setMediaError('Camera permission was blocked or unavailable.');
        }
    }

    /**
     * Requests or stops browser screen capture for static and fallback rooms.
     */
    async function handleToggleScreenShare() {
        setMediaError(null);

        if (sharingScreen) {
            stopMediaStream(screenShareStreamRef.current);
            screenShareStreamRef.current = null;
            setSharingScreen(false);
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
            });
            screenShareStreamRef.current = stream;
            setSharingScreen(true);
        } catch {
            setMediaError('Screen sharing permission was blocked or unavailable.');
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
        if (muted) {
            await call.microphone.enable();
        } else {
            await call.microphone.disable();
        }
    }

    /**
     * Toggles Stream camera publishing after Gracon token checks have passed.
     */
    async function handleToggleCamera() {
        if (cameraOff) {
            await call.camera.enable();
        } else {
            await call.camera.disable();
        }
    }

    /**
     * Toggles Stream screen sharing while keeping the custom Gracon room surface.
     */
    async function handleToggleScreenShare() {
        if (sharingScreen) {
            await call.screenShare.disable();
        } else {
            await call.screenShare.enable();
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
    const [activePanel, setActivePanel] = useState<CollaborationPanel | null>(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [ended, setEnded] = useState(false);
    const [ending, setEnding] = useState(false);
    const [endError, setEndError] = useState<string | null>(null);
    const [roomActionMessage, setRoomActionMessage] = useState<string | null>(null);
    const [messages, setMessages] = useState<RoomMessage[]>(INITIAL_MESSAGES);

    /**
     * Opens the requested collaboration panel or closes it when selected twice.
     */
    function openPanel(panel: CollaborationPanel) {
        setActivePanel((currentPanel) => (currentPanel === panel ? null : panel));
    }

    /**
     * Ends API-backed meetings, while keeping seeded design rooms usable locally.
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
        } catch (err) {
            setEndError(
                err instanceof Error ? err.message : 'Unable to end this meeting right now.',
            );
        } finally {
            setEnding(false);
        }
    }

    /**
     * Starts or stops recording through api/meetings when the room is persisted.
     */
    async function handleToggleRecording() {
        if (recordingBusy) return;

        setRecordingBusy(true);
        setEndError(null);
        setRoomActionMessage(null);

        try {
            if (isUuid(meeting.id)) {
                const result = recording
                    ? await stopMeetingRecording(meeting.id)
                    : await startMeetingRecording(meeting.id);

                setRecording(!recording);
                setRoomActionMessage(
                    result.status === 'PROCESSING'
                        ? 'Recording stopped. The meeting file is processing.'
                        : 'Recording started and will be attached to this meeting.',
                );
            } else {
                setRecording((value) => !value);
                setRoomActionMessage(
                    recording
                        ? 'Recording stopped for this local preview room.'
                        : 'Recording started for this local preview room.',
                );
            }
        } catch (err) {
            setEndError(
                err instanceof Error ? err.message : 'Unable to update recording right now.',
            );
        } finally {
            setRecordingBusy(false);
        }
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
        return (
            <section className={styles.room}>
                <div className={styles.endedState}>
                    <span className={styles.endedIcon}>
                        <Home size={22} />
                    </span>
                    <p className={styles.eyebrow}>Meeting ended</p>
                    <h1>{meeting.title}</h1>
                    <p>
                        This room is closed. Participants can no longer speak, chat, or
                        record in this session.
                    </p>
                    <Link href="/home">Go back home</Link>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.room}>
            <header className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>Live meeting room</p>
                    <h1>{meeting.title}</h1>
                    <p>{meeting.date} · {meeting.time} · Hosted by {meeting.hostName}</p>
                </div>
                <div className={styles.headerActions}>
                    <button type="button" onClick={() => setInviteOpen(true)}>
                        <UserPlus size={16} />
                        Invite
                    </button>
                </div>
            </header>

            {(endError || roomNotice || roomActionMessage) && (
                <p className={styles.roomError}>{endError ?? roomNotice ?? roomActionMessage}</p>
            )}

            <motion.div
                layout
                className={`${styles.stageLayout} ${activePanel ? styles.stageLayoutWithPanel : ''}`}
            >
                <motion.main layout className={styles.stage} aria-label="Meeting stage">
                    <div
                        className={`${styles.videoGrid} ${
                            stageParticipants.length === 1 ? styles.videoGridSingle : ''
                        }`}
                    >
                        {stageParticipants.map((participant, index) => (
                            <motion.article
                                layout
                                key={participant.streamParticipant?.sessionId ?? `${participant.name}-${participant.role}`}
                                className={`${styles.videoTile} ${
                                    participant.speaking ? styles.videoTileSpeaking : ''
                                } ${
                                    stageParticipants.length === 3 && index === 2
                                        ? styles.videoTileFull
                                        : ''
                                }`}
                                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                            >
                                {participant.speaking && recording && (
                                    <div className={styles.recordingPill}>
                                        <Circle size={8} fill="currentColor" />
                                        Recording
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
                sharingScreen={sharingScreen}
                activePanel={activePanel}
                onToggleMute={() => void onToggleMute()}
                onToggleCamera={() => void onToggleCamera()}
                onToggleScreenShare={() => void onToggleScreenShare()}
                onToggleRecording={() => void handleToggleRecording()}
                onToggleMembers={() => openPanel('members')}
                onToggleChat={() => openPanel('chat')}
                ending={ending}
                onEndMeeting={handleEndMeeting}
            />

            {inviteOpen && (
                <MeetingInviteDialog
                    meetingId={meeting.id}
                    attendees={attendees}
                    onClose={() => setInviteOpen(false)}
                />
            )}
        </section>
    );
}

/**
 * Renders the meeting room with Stream presence for API meetings and local media for seeded rooms.
 */
export function MeetingRoom({ meeting }: MeetingRoomProps) {
    const { session, loading, error } = useStreamSession(meeting);

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
            roomNotice={loading ? 'Preparing secure live media...' : error}
        />
    );
}
