/**
 * Chat panel for the static meeting room.
 */
'use client';

import { LockKeyhole, SendHorizontal } from 'lucide-react';
import { useState } from 'react';
import styles from './meeting-chat-panel.module.css';

export interface MeetingRoomMessage {
    sender: string;
    body: string;
    time: string;
}

interface MeetingChatPanelProps {
    messages: MeetingRoomMessage[];
    onSendMessage: (body: string) => void;
}

/**
 * Returns deterministic initials for static chat senders.
 */
function getSenderInitials(sender: string) {
    if (sender === 'You') return 'YO';

    return sender
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || 'GM';
}

/**
 * Renders an in-room chat panel with local message composition and no duplicate tab title.
 */
export function MeetingChatPanel({ messages, onSendMessage }: MeetingChatPanelProps) {
    const [messageDraft, setMessageDraft] = useState('');

    /**
     * Commits the draft into the room-level chat state so the panel can remount safely.
     */
    function sendMessage() {
        const body = messageDraft.trim();
        if (!body) return;

        onSendMessage(body);
        setMessageDraft('');
    }

    return (
        <section className={styles.panel}>
            <div className={styles.summaryCard}>
                <div>
                    <span className={styles.summaryLabel}>Room chat</span>
                    <strong>{messages.length} messages</strong>
                </div>
                <span className={styles.securePill}>
                    <LockKeyhole size={13} />
                    Internal
                </span>
            </div>

            <div className={styles.messageList}>
                {messages.map((message) => (
                    <article
                        key={`${message.sender}-${message.time}-${message.body}`}
                        className={message.sender === 'You' ? styles.ownMessage : ''}
                    >
                        <span className={styles.avatar}>{getSenderInitials(message.sender)}</span>
                        <div className={styles.messageBody}>
                            <header>
                                <strong>{message.sender}</strong>
                                <span>{message.time}</span>
                            </header>
                            <p>{message.body}</p>
                        </div>
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
                <button type="button" aria-label="Send message" onClick={sendMessage}>
                    <SendHorizontal size={15} />
                    Send
                </button>
            </div>
        </section>
    );
}
