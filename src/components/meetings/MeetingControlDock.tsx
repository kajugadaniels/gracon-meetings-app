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
    Keyboard,
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
    onOpenShortcuts: () => void;
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
    onOpenShortcuts,
    onEndMeeting,
}: MeetingControlDockProps) {
    return (
        <div className={styles.controlDock} aria-label="Meeting actions">
            <button
                type="button"
                title={muted ? 'Unmute microphone (M)' : 'Mute microphone (M)'}
                aria-pressed={!muted}
                onClick={onToggleMute}
            >
                {muted ? <MicOff size={18} /> : <Mic size={18} />}
                {muted ? 'Unmute' : 'Mute'}
            </button>
            <button
                type="button"
                title={cameraOff ? 'Start camera (V)' : 'Stop camera (V)'}
                aria-pressed={!cameraOff}
                onClick={onToggleCamera}
            >
                {cameraOff ? <VideoOff size={18} /> : <Video size={18} />}
                {cameraOff ? 'Start video' : 'Stop video'}
            </button>
            <button
                type="button"
                className={sharingScreen ? styles.activeButton : ''}
                title={sharingScreen ? 'Stop screen sharing (S)' : 'Share screen (S)'}
                aria-pressed={sharingScreen}
                onClick={onToggleScreenShare}
            >
                <MonitorUp size={18} />
                {sharingScreen ? 'Stop share' : 'Share'}
            </button>
            <button
                type="button"
                className={recording ? styles.activeButton : ''}
                disabled={recordingBusy}
                title={recording ? 'Stop recording (R)' : 'Start recording (R)'}
                aria-pressed={recording}
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
                title={handRaised ? 'Lower hand (H)' : 'Raise hand (H)'}
                aria-pressed={handRaised}
                onClick={onToggleRaiseHand}
            >
                <Hand size={18} />
                {handRaised ? 'Lower hand' : 'Raise hand'}
            </button>
            <button
                type="button"
                className={activePanel === 'members' ? styles.activeButton : ''}
                title="Open members panel"
                aria-pressed={activePanel === 'members'}
                onClick={onToggleMembers}
            >
                <UsersRound size={18} />
                Members
            </button>
            <button
                type="button"
                className={activePanel === 'chat' ? styles.activeButton : ''}
                title="Open chat panel"
                aria-pressed={activePanel === 'chat'}
                onClick={onToggleChat}
            >
                <MessageSquare size={18} />
                Chat
            </button>
            <button type="button" title="Open room settings" onClick={onOpenSettings}>
                <Settings size={18} />
                Settings
            </button>
            <button type="button" title="Show keyboard shortcuts" onClick={onOpenShortcuts}>
                <Keyboard size={18} />
                Shortcuts
            </button>
            <button
                type="button"
                className={styles.leaveButton}
                disabled={ending}
                title="End meeting for everyone"
                onClick={onEndMeeting}
            >
                <PhoneOff size={18} />
                {ending ? 'Ending' : 'End'}
            </button>
        </div>
    );
}
