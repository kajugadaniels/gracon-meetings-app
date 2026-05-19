/**
 * Browser-safe meeting view models derived from api/meetings contracts.
 *
 * The UI should consume these compact shapes instead of backend DTOs directly
 * so layout, filtering, and empty states can evolve without changing API
 * payload contracts.
 */
import type {
    Meeting,
    MeetingParticipant,
    MeetingRecording,
    MeetingVisibility,
} from './types';

export type MeetingReadiness = 'READY' | 'WAITING_INVITES' | 'NEEDS_REVIEW';

export interface MeetingCardView {
    id: string;
    title: string;
    date: string;
    time: string;
    scheduledStartAt: string;
    attendees: string[];
    overflowCount: number;
    visibility: MeetingVisibility;
    readiness: MeetingReadiness;
    hasRecording: boolean;
    needsFollowUp: boolean;
}

export interface RecordingCardView {
    id: string;
    title: string;
    recordedAt: string;
    recordedAtIso: string;
    duration: string;
    size: string;
    status: string;
    owner: string;
    shared: boolean;
}

export interface MeetingsSummary {
    upcomingCount: number;
    previousCount: number;
    recordedCount: number;
    invitedGuestCount: number;
    sharedRecordingCount: number;
}

export interface MeetingRoomAttendeeView {
    initials: string;
    name: string;
    email: string;
    role: string;
}

export interface MeetingRoomView {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    scheduledStartAt: string;
    scheduledEndAt: string;
    visibility: MeetingVisibility;
    readiness: MeetingReadiness;
    hostName: string;
    attendees: MeetingRoomAttendeeView[];
    attendeeCount: number;
    agendaItems: string[];
}

const DATE_FORMATTER = new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});
const TIME_FORMATTER = new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
});

/**
 * Formats a persisted meeting timestamp for card and header surfaces.
 */
export function formatMeetingDate(isoDate: string): string {
    return DATE_FORMATTER.format(new Date(isoDate));
}

/**
 * Formats a persisted meeting timestamp into the user's local clock.
 */
export function formatMeetingTime(isoDate: string): string {
    return TIME_FORMATTER.format(new Date(isoDate));
}

/**
 * Produces initials from a participant name or email without exposing extra data.
 */
export function getParticipantInitials(
    displayName: string | null | undefined,
    email: string,
): string {
    const source = (displayName?.trim() || email.split('@')[0] || 'Guest')
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .trim();
    const parts = source.split(/\s+/).filter(Boolean);

    if (parts.length === 0) return 'G';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

/**
 * Returns the timestamp that should drive meeting sorting and filtering.
 */
export function getMeetingSortDate(meeting: Meeting): string {
    return meeting.scheduledStartAt
        ?? meeting.startedAt
        ?? meeting.createdAt
        ?? new Date().toISOString();
}

/**
 * Converts a backend participant into a room attendee view.
 */
export function toMeetingRoomAttendeeView(
    participant: MeetingParticipant,
): MeetingRoomAttendeeView {
    const name = participant.displayName?.trim() || participant.email;

    return {
        initials: getParticipantInitials(participant.displayName, participant.email),
        name,
        email: participant.email,
        role: participant.role.replace('_', ' ').toLowerCase(),
    };
}

/**
 * Converts a backend meeting into the compact meeting card contract.
 */
export function toMeetingCardView(
    meeting: Meeting,
    recordings: MeetingRecording[] = [],
): MeetingCardView {
    const scheduledStartAt = getMeetingSortDate(meeting);
    const participants = meeting.participants ?? [];
    const visibleParticipants = participants.slice(0, 4);
    const hasReadyRecording = recordings.some((recording) => (
        recording.status === 'READY' || recording.status === 'PROCESSING'
    ));

    return {
        id: meeting.id,
        title: meeting.title,
        date: formatMeetingDate(scheduledStartAt),
        time: formatMeetingTime(scheduledStartAt),
        scheduledStartAt,
        attendees: visibleParticipants.map((participant) => (
            getParticipantInitials(participant.displayName, participant.email)
        )),
        overflowCount: Math.max(participants.length - visibleParticipants.length, 0),
        visibility: meeting.visibility,
        readiness: participants.some((participant) => participant.status === 'INVITED')
            ? 'WAITING_INVITES'
            : 'READY',
        hasRecording: hasReadyRecording,
        needsFollowUp: meeting.status === 'ENDED' && !hasReadyRecording,
    };
}

/**
 * Converts a backend recording into the compact recording card contract.
 */
export function toRecordingCardView(
    recording: MeetingRecording,
    meeting?: Meeting,
): RecordingCardView {
    const recordedAtIso = recording.startedAt
        ?? recording.endedAt
        ?? recording.createdAt;
    const durationSeconds = recording.durationSeconds ?? 0;
    const sizeBytes = recording.sizeBytes ?? 0;

    return {
        id: recording.id,
        title: meeting?.title ?? `Recording ${recording.id.slice(0, 8)}`,
        recordedAt: `Recorded ${formatMeetingDate(recordedAtIso)} at ${formatMeetingTime(recordedAtIso)}`,
        recordedAtIso,
        duration: formatDuration(durationSeconds),
        size: formatBytes(sizeBytes),
        status: toTitleCase(recording.status),
        owner: getRecordingOwner(meeting),
        shared: Boolean(recording.providerAssetUrl || recording.s3Key),
    };
}

/**
 * Splits backend meetings into card-ready upcoming and previous collections.
 */
export function splitMeetingCards(
    meetings: Meeting[],
    recordingsByMeetingId: Map<string, MeetingRecording[]> = new Map(),
): { upcoming: MeetingCardView[]; previous: MeetingCardView[] } {
    const cards = meetings.map((meeting) => (
        toMeetingCardView(meeting, recordingsByMeetingId.get(meeting.id) ?? [])
    ));

    return {
        upcoming: cards
            .filter((card) => {
                const sourceMeeting = meetings.find((meeting) => meeting.id === card.id);
                return sourceMeeting?.status === 'SCHEDULED'
                    || sourceMeeting?.status === 'LIVE'
                    || sourceMeeting?.status === 'DRAFT';
            })
            .sort((first, second) => (
                new Date(first.scheduledStartAt).getTime()
                - new Date(second.scheduledStartAt).getTime()
            )),
        previous: cards
            .filter((card) => {
                const sourceMeeting = meetings.find((meeting) => meeting.id === card.id);
                return sourceMeeting?.status === 'ENDED'
                    || sourceMeeting?.status === 'CANCELLED';
            })
            .sort((first, second) => (
                new Date(second.scheduledStartAt).getTime()
                - new Date(first.scheduledStartAt).getTime()
            )),
    };
}

/**
 * Builds page-level counters from backend meetings and recordings.
 */
export function buildMeetingsSummary(
    meetings: Meeting[],
    recordings: RecordingCardView[] = [],
): MeetingsSummary {
    return meetings.reduce<MeetingsSummary>(
        (summary, meeting) => {
            if (
                meeting.status === 'SCHEDULED'
                || meeting.status === 'LIVE'
                || meeting.status === 'DRAFT'
            ) {
                summary.upcomingCount += 1;
            }

            if (meeting.status === 'ENDED' || meeting.status === 'CANCELLED') {
                summary.previousCount += 1;
            }

            summary.invitedGuestCount += meeting.participants?.length ?? 0;
            return summary;
        },
        {
            upcomingCount: 0,
            previousCount: 0,
            recordedCount: recordings.length,
            invitedGuestCount: 0,
            sharedRecordingCount: recordings.filter((recording) => recording.shared).length,
        },
    );
}

/**
 * Creates a safe custom-room fallback before the full meeting endpoint is wired
 * into the room server component.
 */
export function createMeetingRoomFallback(
    id: string,
    title = 'Secure meeting room',
): MeetingRoomView {
    const now = new Date();
    const nowIso = now.toISOString();

    return {
        id,
        title,
        description: 'Live Gracon meeting room.',
        date: formatMeetingDate(nowIso),
        time: formatMeetingTime(nowIso),
        scheduledStartAt: nowIso,
        scheduledEndAt: nowIso,
        visibility: 'INVITE_ONLY',
        readiness: 'READY',
        hostName: 'Daniel KAJUGA',
        attendees: [
            {
                initials: 'DK',
                name: 'Daniel KAJUGA',
                email: 'host@gracon360.com',
                role: 'Host',
            },
        ],
        attendeeCount: 1,
        agendaItems: ['Open discussion', 'Share decisions', 'Confirm next steps'],
    };
}

/**
 * Formats a recording duration into a compact mm:ss or h:mm:ss label.
 */
function formatDuration(totalSeconds: number): string {
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '00:00';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Formats bytes into a compact storage label for recording cards.
 */
function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return 'Pending size';

    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }

    return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Converts enum-style API values into readable card labels.
 */
function toTitleCase(value: string): string {
    return value
        .toLowerCase()
        .split('_')
        .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
        .join(' ');
}

/**
 * Finds the best available recording owner label without exposing ids.
 */
function getRecordingOwner(meeting?: Meeting): string {
    const host = meeting?.participants?.find((participant) => participant.role === 'HOST');
    return host?.displayName?.trim() || host?.email || 'Meeting host';
}
