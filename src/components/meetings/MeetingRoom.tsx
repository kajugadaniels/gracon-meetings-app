/**
 * Zoom-style meeting room surface for design and workflow validation.
 */
'use client';

import {
    Circle,
    Home,
    UserPlus,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { endMeeting } from '@/lib/meetings/api-client';
import type { MeetingRoomView } from '@/lib/meetings/static-meetings';
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

/**
 * Detects API-backed meeting ids so seeded design rooms do not call the backend.
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
 * Builds a stable initials fallback for the meeting host when seed data does not expose one.
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
 * Returns the visible stage participants using the host as the active speaker.
 */
function getStageParticipants(meeting: MeetingRoomView): StageParticipant[] {
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
 * Renders a non-media static meeting room with controls, chat, members, and invite flow.
 */
export function MeetingRoom({ meeting }: MeetingRoomProps) {
    const [muted, setMuted] = useState(true);
    const [cameraOff, setCameraOff] = useState(true);
    const [recording, setRecording] = useState(true);
    const [activePanel, setActivePanel] = useState<CollaborationPanel | null>(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [ended, setEnded] = useState(false);
    const [ending, setEnding] = useState(false);
    const [endError, setEndError] = useState<string | null>(null);
    const [mediaError, setMediaError] = useState<string | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const videoStreamRef = useRef<MediaStream | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const stageParticipants = getStageParticipants(meeting);

    useEffect(() => {
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = cameraOff ? null : videoStreamRef.current;
        }
    }, [cameraOff]);

    useEffect(() => () => {
        stopMediaStream(audioStreamRef.current);
        stopMediaStream(videoStreamRef.current);
    }, []);

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
     * Requests or stops the microphone track based on the current muted state.
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
     * Requests or stops the camera track based on the current camera state.
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

            {(endError || mediaError) && (
                <p className={styles.roomError}>{endError ?? mediaError}</p>
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
                                key={`${participant.name}-${participant.role}`}
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
                                {participant.speaking && !cameraOff ? (
                                    <video
                                        ref={localVideoRef}
                                        className={styles.localVideo}
                                        autoPlay
                                        muted
                                        playsInline
                                    />
                                ) : (
                                    <span className={styles.videoAvatar}>{participant.initials}</span>
                                )}
                                <div className={styles.videoMeta}>
                                    <strong>{participant.name}</strong>
                                    <small>
                                        {participant.speaking && !muted ? 'Speaking · Mic on' : participant.role}
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
                            attendees={meeting.attendees}
                            attendeeCount={meeting.attendeeCount}
                            muted={muted}
                            cameraOff={cameraOff}
                            initialMessages={INITIAL_MESSAGES}
                            onToggleMute={handleToggleMute}
                            onToggleCamera={handleToggleCamera}
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
                activePanel={activePanel}
                onToggleMute={() => void handleToggleMute()}
                onToggleCamera={() => void handleToggleCamera()}
                onToggleRecording={() => setRecording((value) => !value)}
                onToggleMembers={() => openPanel('members')}
                onToggleChat={() => openPanel('chat')}
                ending={ending}
                onEndMeeting={handleEndMeeting}
            />

            {inviteOpen && (
                <MeetingInviteDialog
                    meetingId={meeting.id}
                    attendees={meeting.attendees}
                    onClose={() => setInviteOpen(false)}
                />
            )}
        </section>
    );
}
