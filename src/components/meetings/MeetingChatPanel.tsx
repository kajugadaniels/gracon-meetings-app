/**
 * Chat panel for the static meeting room.
 */
'use client';

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
 * Renders an in-room chat panel with local message composition.
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
    );
}
