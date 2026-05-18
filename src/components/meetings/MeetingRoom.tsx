/**
 * Zoom-style meeting room surface for design and workflow validation.
 */
'use client';

import {
    Circle,
    ShieldCheck,
    UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import type { MeetingRoomView } from '@/lib/meetings/static-meetings';
import { MeetingChatPanel } from './MeetingChatPanel';
import { MeetingControlDock } from './MeetingControlDock';
import { MeetingInviteDialog } from './MeetingInviteDialog';
import { MeetingMembersPanel } from './MeetingMembersPanel';
import styles from './meeting-room.module.css';

interface MeetingRoomProps {
    meeting: MeetingRoomView;
}

interface RoomMessage {
    sender: string;
    body: string;
    time: string;
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
 * Renders a non-media static meeting room with controls, chat, members, and invite flow.
 */
export function MeetingRoom({ meeting }: MeetingRoomProps) {
    const [muted, setMuted] = useState(false);
    const [cameraOff, setCameraOff] = useState(false);
    const [recording, setRecording] = useState(true);
    const [chatOpen, setChatOpen] = useState(true);
    const [membersOpen, setMembersOpen] = useState(true);
    const [inviteOpen, setInviteOpen] = useState(false);

    return (
        <section className={styles.room}>
            <header className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>Live meeting room</p>
                    <h1>{meeting.title}</h1>
                    <p>{meeting.date} · {meeting.time} · Hosted by {meeting.hostName}</p>
                </div>
                <div className={styles.headerActions}>
                    <span className={styles.secureBadge}>
                        <ShieldCheck size={15} />
                        Secure room
                    </span>
                    <button type="button" onClick={() => setInviteOpen(true)}>
                        <UserPlus size={16} />
                        Invite
                    </button>
                </div>
            </header>

            <div className={styles.stageLayout}>
                <main className={styles.stage} aria-label="Meeting stage">
                    <div className={styles.speakerTile}>
                        <div className={styles.speakerAvatar}>DK</div>
                        <div className={styles.speakerMeta}>
                            <strong>{meeting.hostName}</strong>
                            <span>Speaking · Host</span>
                        </div>
                        {recording && (
                            <div className={styles.recordingPill}>
                                <Circle size={9} fill="currentColor" />
                                Recording
                            </div>
                        )}
                    </div>

                    <div className={styles.participantGrid}>
                        {meeting.attendees.slice(1, 7).map((attendee, index) => (
                            <article key={attendee.email} className={styles.participantTile}>
                                <span>{attendee.initials}</span>
                                <strong>{attendee.name}</strong>
                                <small>{index % 3 === 0 ? 'Muted' : attendee.role}</small>
                            </article>
                        ))}
                    </div>

                    <MeetingControlDock
                        muted={muted}
                        cameraOff={cameraOff}
                        recording={recording}
                        onToggleMute={() => setMuted((value) => !value)}
                        onToggleCamera={() => setCameraOff((value) => !value)}
                        onToggleRecording={() => setRecording((value) => !value)}
                        onToggleMembers={() => setMembersOpen((value) => !value)}
                        onToggleChat={() => setChatOpen((value) => !value)}
                    />
                </main>

                <aside className={styles.sideRail} aria-label="Meeting collaboration panels">
                    {membersOpen && (
                        <MeetingMembersPanel
                            attendees={meeting.attendees}
                            attendeeCount={meeting.attendeeCount}
                        />
                    )}

                    {chatOpen && (
                        <MeetingChatPanel initialMessages={INITIAL_MESSAGES} />
                    )}
                </aside>
            </div>

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
