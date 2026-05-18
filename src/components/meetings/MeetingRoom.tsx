/**
 * Zoom-style meeting room surface for design and workflow validation.
 */
'use client';

import {
    Circle,
    Copy,
    Search,
    ShieldCheck,
    UserPlus,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { MeetingRoomView } from '@/lib/meetings/static-meetings';
import { MeetingControlDock } from './MeetingControlDock';
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
    const [inviteSearch, setInviteSearch] = useState('');
    const [messageDraft, setMessageDraft] = useState('');
    const [messages, setMessages] = useState(INITIAL_MESSAGES);

    const visibleInvitees = useMemo(() => {
        const normalizedSearch = inviteSearch.trim().toLowerCase();
        const candidates = meeting.attendees.slice(0, 8);

        if (normalizedSearch.length < 2) return candidates;

        return candidates.filter((attendee) => (
            attendee.name.toLowerCase().includes(normalizedSearch)
            || attendee.email.toLowerCase().includes(normalizedSearch)
        ));
    }, [inviteSearch, meeting.attendees]);

    function sendMessage() {
        const body = messageDraft.trim();
        if (!body) return;

        setMessages((currentMessages) => [
            ...currentMessages,
            {
                sender: 'You',
                body,
                time: new Intl.DateTimeFormat(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                }).format(new Date()),
            },
        ]);
        setMessageDraft('');
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
                        <section className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <h2>Members</h2>
                                <span>{meeting.attendeeCount}</span>
                            </div>
                            <div className={styles.memberList}>
                                {meeting.attendees.slice(0, 7).map((attendee) => (
                                    <article key={attendee.email} className={styles.memberItem}>
                                        <span>{attendee.initials}</span>
                                        <div>
                                            <strong>{attendee.name}</strong>
                                            <small>{attendee.role}</small>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}

                    {chatOpen && (
                        <section className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <h2>Chat</h2>
                                <span>{messages.length}</span>
                            </div>
                            <div className={styles.messageList}>
                                {messages.map((message) => (
                                    <article key={`${message.sender}-${message.time}-${message.body}`}>
                                        <div>
                                            <strong>{message.sender}</strong>
                                            <span>{message.time}</span>
                                        </div>
                                        <p>{message.body}</p>
                                    </article>
                                ))}
                            </div>
                            <div className={styles.chatComposer}>
                                <input
                                    value={messageDraft}
                                    onChange={(event) => setMessageDraft(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') sendMessage();
                                    }}
                                    placeholder="Message everyone..."
                                />
                                <button type="button" onClick={sendMessage}>Send</button>
                            </div>
                        </section>
                    )}
                </aside>
            </div>

            {inviteOpen && (
                <div
                    className={styles.dialogOverlay}
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setInviteOpen(false);
                    }}
                >
                    <section className={styles.inviteDialog} role="dialog" aria-modal="true" aria-labelledby="invite-title">
                        <div className={styles.dialogHeader}>
                            <div>
                                <p className={styles.eyebrow}>Invite people</p>
                                <h2 id="invite-title">Bring someone into this room</h2>
                            </div>
                            <button type="button" onClick={() => setInviteOpen(false)}>Close</button>
                        </div>

                        <label className={styles.inviteSearch}>
                            <Search size={16} />
                            <span>Search invitees</span>
                            <input
                                value={inviteSearch}
                                onChange={(event) => setInviteSearch(event.target.value)}
                                placeholder="Search by name or email..."
                            />
                        </label>

                        <div className={styles.inviteLink}>
                            <div>
                                <span>Meeting link</span>
                                <strong>https://meet.gracon360.com/{meeting.id}</strong>
                            </div>
                            <button type="button">
                                <Copy size={15} />
                                Copy
                            </button>
                        </div>

                        <div className={styles.inviteList}>
                            {visibleInvitees.map((attendee) => (
                                <article key={attendee.email}>
                                    <span>{attendee.initials}</span>
                                    <div>
                                        <strong>{attendee.name}</strong>
                                        <small>{attendee.email}</small>
                                    </div>
                                    <button type="button">Invite</button>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
}
