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
    initialMessages: MeetingRoomMessage[];
}

/**
 * Returns the current local time label for static chat messages.
 */
function getCurrentTimeLabel() {
    return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(new Date());
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
export function MeetingChatPanel({ initialMessages }: MeetingChatPanelProps) {
    const [messageDraft, setMessageDraft] = useState('');
    const [messages, setMessages] = useState(initialMessages);

    function sendMessage() {
        const body = messageDraft.trim();
        if (!body) return;

        setMessages((currentMessages) => [
            ...currentMessages,
            {
                sender: 'You',
                body,
                time: getCurrentTimeLabel(),
            },
        ]);
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
