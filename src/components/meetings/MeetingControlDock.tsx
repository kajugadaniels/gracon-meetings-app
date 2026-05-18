/**
 * Reusable in-room meeting action dock.
 */
import {
    Captions,
    Circle,
    Hand,
    MessageSquare,
    Mic,
    MicOff,
    MonitorUp,
    MoreHorizontal,
    PhoneOff,
    Settings,
    UsersRound,
    Video,
    VideoOff,
} from 'lucide-react';
import styles from './meeting-control-dock.module.css';

interface MeetingControlDockProps {
    muted: boolean;
    cameraOff: boolean;
    recording: boolean;
    onToggleMute: () => void;
    onToggleCamera: () => void;
    onToggleRecording: () => void;
    onToggleMembers: () => void;
    onToggleChat: () => void;
}

/**
 * Renders the primary meeting room controls as a standalone action dock.
 */
export function MeetingControlDock({
    muted,
    cameraOff,
    recording,
    onToggleMute,
    onToggleCamera,
    onToggleRecording,
    onToggleMembers,
    onToggleChat,
}: MeetingControlDockProps) {
    return (
        <div className={styles.controlDock} aria-label="Meeting actions">
            <button type="button" onClick={onToggleMute}>
                {muted ? <MicOff size={18} /> : <Mic size={18} />}
                {muted ? 'Unmute' : 'Mute'}
            </button>
            <button type="button" onClick={onToggleCamera}>
                {cameraOff ? <VideoOff size={18} /> : <Video size={18} />}
                {cameraOff ? 'Start video' : 'Stop video'}
            </button>
            <button type="button">
                <MonitorUp size={18} />
                Share
            </button>
            <button type="button" onClick={onToggleRecording}>
                <Circle size={14} fill="currentColor" />
                {recording ? 'Stop recording' : 'Record'}
            </button>
            <button type="button">
                <Captions size={18} />
                Captions
            </button>
            <button type="button">
                <Hand size={18} />
                Raise hand
            </button>
            <button type="button" onClick={onToggleMembers}>
                <UsersRound size={18} />
                Members
            </button>
            <button type="button" onClick={onToggleChat}>
                <MessageSquare size={18} />
                Chat
            </button>
            <button type="button">
                <Settings size={18} />
                Settings
            </button>
            <button type="button">
                <MoreHorizontal size={18} />
                More
            </button>
            <button type="button" className={styles.leaveButton}>
                <PhoneOff size={18} />
                End
            </button>
        </div>
    );
}
