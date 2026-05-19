/**
 * Animated side panel that switches between meeting members and chat.
 */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare, Mic, MicOff, UsersRound, Video, VideoOff, X } from 'lucide-react';
import type { MeetingRoomAttendeeView } from '@/lib/meetings/meeting-view-models';
import { MeetingChatPanel, type MeetingRoomMessage } from './MeetingChatPanel';
import { MeetingMembersPanel } from './MeetingMembersPanel';
import styles from './meeting-collaboration-panel.module.css';

type CollaborationPanel = 'members' | 'chat';

interface MeetingCollaborationPanelProps {
    activePanel: CollaborationPanel;
    attendees: MeetingRoomAttendeeView[];
    attendeeCount: number;
    muted: boolean;
    cameraOff: boolean;
    messages: MeetingRoomMessage[];
    onToggleMute: () => void;
    onToggleCamera: () => void;
    onSendMessage: (body: string) => void;
    onChangePanel: (panel: CollaborationPanel) => void;
    onClose: () => void;
}

/**
 * Renders the in-room collaboration drawer with tabbed members and chat content.
 */
export function MeetingCollaborationPanel({
    activePanel,
    attendees,
    attendeeCount,
    muted,
    cameraOff,
    messages,
    onToggleMute,
    onToggleCamera,
    onSendMessage,
    onChangePanel,
    onClose,
}: MeetingCollaborationPanelProps) {
    return (
        <motion.aside
            layout
            className={styles.panel}
            aria-label="Meeting collaboration"
            initial={{ opacity: 0, x: 28, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 28, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
            <header className={styles.header}>
                <div>
                    <p>Meeting tools</p>
                    <h2>{activePanel === 'members' ? 'Members' : 'Chat'}</h2>
                </div>
                <button type="button" aria-label="Close meeting tools" onClick={onClose}>
                    <X size={16} />
                </button>
            </header>

            <div className={styles.tabs} role="tablist" aria-label="Meeting tools tabs">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activePanel === 'members'}
                    className={activePanel === 'members' ? styles.activeTab : ''}
                    onClick={() => onChangePanel('members')}
                >
                    <UsersRound size={15} />
                    Members
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activePanel === 'chat'}
                    className={activePanel === 'chat' ? styles.activeTab : ''}
                    onClick={() => onChangePanel('chat')}
                >
                    <MessageSquare size={15} />
                    Chat
                </button>
            </div>

            <div className={styles.mediaControls} aria-label="My media controls">
                <button
                    type="button"
                    className={!muted ? styles.mediaControlActive : ''}
                    onClick={onToggleMute}
                >
                    {muted ? <MicOff size={15} /> : <Mic size={15} />}
                    {muted ? 'Mic off' : 'Mic on'}
                </button>
                <button
                    type="button"
                    className={!cameraOff ? styles.mediaControlActive : ''}
                    onClick={onToggleCamera}
                >
                    {cameraOff ? <VideoOff size={15} /> : <Video size={15} />}
                    {cameraOff ? 'Camera off' : 'Camera on'}
                </button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={activePanel}
                    className={styles.tabSurface}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.16 }}
                >
                    {activePanel === 'members' ? (
                        <MeetingMembersPanel
                            attendees={attendees}
                            attendeeCount={attendeeCount}
                            muted={muted}
                            cameraOff={cameraOff}
                            onToggleMute={onToggleMute}
                            onToggleCamera={onToggleCamera}
                        />
                    ) : (
                        <MeetingChatPanel messages={messages} onSendMessage={onSendMessage} />
                    )}
                </motion.div>
            </AnimatePresence>
        </motion.aside>
    );
}
