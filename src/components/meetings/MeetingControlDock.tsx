/**
 * Reusable in-room meeting action dock.
 */
import {
    Circle,
    Hand,
    MessageSquare,
    Mic,
    MicOff,
    MonitorUp,
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
    sharingScreen: boolean;
    handRaised: boolean;
    recordingElapsedLabel?: string;
    recordingBusy?: boolean;
    ending?: boolean;
    activePanel: 'members' | 'chat' | null;
    onToggleMute: () => void;
    onToggleCamera: () => void;
    onToggleScreenShare: () => void;
    onToggleRecording: () => void;
    onToggleRaiseHand: () => void;
    onToggleMembers: () => void;
    onToggleChat: () => void;
    onOpenSettings: () => void;
    onEndMeeting: () => void;
}

/**
 * Renders the primary meeting room controls as a standalone action dock.
 */
export function MeetingControlDock({
    muted,
    cameraOff,
    recording,
    sharingScreen,
    handRaised,
    recordingElapsedLabel,
    recordingBusy = false,
    ending = false,
    activePanel,
    onToggleMute,
    onToggleCamera,
    onToggleScreenShare,
    onToggleRecording,
    onToggleRaiseHand,
    onToggleMembers,
    onToggleChat,
    onOpenSettings,
    onEndMeeting,
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
            <button
                type="button"
                className={sharingScreen ? styles.activeButton : ''}
                onClick={onToggleScreenShare}
            >
                <MonitorUp size={18} />
                {sharingScreen ? 'Stop share' : 'Share'}
            </button>
            <button
                type="button"
                className={recording ? styles.activeButton : ''}
                disabled={recordingBusy}
                onClick={onToggleRecording}
            >
                <Circle size={14} fill="currentColor" />
                {recordingBusy
                    ? 'Saving'
                    : recording
                        ? `Stop ${recordingElapsedLabel ?? ''}`.trim()
                        : 'Record'}
            </button>
            <button
                type="button"
                className={handRaised ? styles.activeButton : ''}
                onClick={onToggleRaiseHand}
            >
                <Hand size={18} />
                {handRaised ? 'Lower hand' : 'Raise hand'}
            </button>
            <button
                type="button"
                className={activePanel === 'members' ? styles.activeButton : ''}
                onClick={onToggleMembers}
            >
                <UsersRound size={18} />
                Members
            </button>
            <button
                type="button"
                className={activePanel === 'chat' ? styles.activeButton : ''}
                onClick={onToggleChat}
            >
                <MessageSquare size={18} />
                Chat
            </button>
            <button type="button" onClick={onOpenSettings}>
                <Settings size={18} />
                Settings
            </button>
            <button
                type="button"
                className={styles.leaveButton}
                disabled={ending}
                onClick={onEndMeeting}
            >
                <PhoneOff size={18} />
                {ending ? 'Ending' : 'End'}
            </button>
        </div>
    );
}
