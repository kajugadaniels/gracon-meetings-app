/**
 * Typed adapters for the local meetings seed dataset used by static pages.
 */
import meetingsDataset from '@/data/meetings.json';

export type MeetingStatus = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

interface SeedAttendee {
    initials: string;
    name: string;
    email: string;
    role: string;
}

interface SeedRecording {
    id: string;
    title: string;
    status: 'READY';
    duration: string;
    size: string;
    recordedAt: string;
    shared: boolean;
    retention: string;
}

interface SeedMeeting {
    id: string;
    title: string;
    description: string;
    status: MeetingStatus;
    category: string;
    visibility: 'INVITE_ONLY' | 'PRIVATE' | 'LINK_ACCESS';
    readiness: 'READY' | 'WAITING_INVITES' | 'NEEDS_REVIEW';
    scheduledStartAt: string;
    scheduledEndAt: string;
    timezone: string;
    roomUrl: string;
    host: {
        name: string;
        email: string;
    };
    attendees: SeedAttendee[];
    attendeeCount: number;
    agendaItems: string[];
    recording: SeedRecording | null;
}

interface MeetingsDataset {
    generatedAt: string;
    version: number;
    meetings: SeedMeeting[];
}

export interface MeetingCardView {
    id: string;
    title: string;
    date: string;
    time: string;
    scheduledStartAt: string;
    attendees: string[];
    overflowCount: number;
    visibility: SeedMeeting['visibility'];
    readiness: SeedMeeting['readiness'];
    hasRecording: boolean;
    needsFollowUp: boolean;
}

export interface RecordingCardView {
    id: string;
    title: string;
    recordedAt: string;
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

const dataset = meetingsDataset as MeetingsDataset;
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
 * Converts raw seed data into the compact props expected by MeetingCard.
 */
function toMeetingCardView(meeting: SeedMeeting): MeetingCardView {
    const visibleAttendees = meeting.attendees.slice(0, 4);

    return {
        id: meeting.id,
        title: meeting.title,
        date: DATE_FORMATTER.format(new Date(meeting.scheduledStartAt)),
        time: TIME_FORMATTER.format(new Date(meeting.scheduledStartAt)),
        scheduledStartAt: meeting.scheduledStartAt,
        attendees: visibleAttendees.map((attendee) => attendee.initials),
        overflowCount: Math.max(meeting.attendeeCount - visibleAttendees.length, 0),
        visibility: meeting.visibility,
        readiness: meeting.readiness,
        hasRecording: Boolean(meeting.recording),
        needsFollowUp: meeting.readiness === 'NEEDS_REVIEW',
    };
}

/**
 * Converts raw recorded meetings into the compact props expected by RecordingCard.
 */
function toRecordingCardView(meeting: SeedMeeting): RecordingCardView | null {
    if (!meeting.recording) return null;

    return {
        id: meeting.recording.id,
        title: meeting.title,
        recordedAt: `Recorded ${DATE_FORMATTER.format(new Date(meeting.recording.recordedAt))} at ${TIME_FORMATTER.format(new Date(meeting.recording.recordedAt))}`,
        duration: meeting.recording.duration,
        size: meeting.recording.size,
        status: meeting.recording.status === 'READY' ? 'Ready' : meeting.recording.status,
        owner: meeting.host.name,
        shared: meeting.recording.shared,
    };
}

/**
 * Returns upcoming meetings sorted by the nearest scheduled start time.
 */
export function getUpcomingMeetingCards(limit?: number): MeetingCardView[] {
    const meetings = [...dataset.meetings]
        .filter((meeting) => meeting.status === 'UPCOMING')
        .sort((first, second) => (
            new Date(first.scheduledStartAt).getTime() - new Date(second.scheduledStartAt).getTime()
        ))
        .map(toMeetingCardView);

    return typeof limit === 'number' ? meetings.slice(0, limit) : meetings;
}

/**
 * Returns completed meetings sorted from newest to oldest.
 */
export function getPreviousMeetingCards(limit?: number): MeetingCardView[] {
    const meetings = [...dataset.meetings]
        .filter((meeting) => meeting.status === 'COMPLETED')
        .sort((first, second) => (
            new Date(second.scheduledStartAt).getTime() - new Date(first.scheduledStartAt).getTime()
        ))
        .map(toMeetingCardView);

    return typeof limit === 'number' ? meetings.slice(0, limit) : meetings;
}

/**
 * Returns ready recordings sorted from newest to oldest.
 */
export function getRecordingCards(limit?: number): RecordingCardView[] {
    const recordings = dataset.meetings
        .flatMap((meeting) => {
            const recording = toRecordingCardView(meeting);
            return recording ? [{ meeting, recording }] : [];
        })
        .sort((first, second) => {
            const firstRecordedAt = first.meeting.recording?.recordedAt ?? first.meeting.scheduledStartAt;
            const secondRecordedAt = second.meeting.recording?.recordedAt ?? second.meeting.scheduledStartAt;
            return new Date(secondRecordedAt).getTime() - new Date(firstRecordedAt).getTime();
        })
        .map(({ recording }) => recording);

    return typeof limit === 'number' ? recordings.slice(0, limit) : recordings;
}

/**
 * Returns aggregate counts used by the static meetings dashboards.
 */
export function getMeetingsSummary(): MeetingsSummary {
    return dataset.meetings.reduce<MeetingsSummary>(
        (summary, meeting) => {
            if (meeting.status === 'UPCOMING') summary.upcomingCount += 1;
            if (meeting.status === 'COMPLETED') summary.previousCount += 1;
            if (meeting.recording) {
                summary.recordedCount += 1;
                if (meeting.recording.shared) summary.sharedRecordingCount += 1;
            }
            summary.invitedGuestCount += meeting.attendeeCount;
            return summary;
        },
        {
            upcomingCount: 0,
            previousCount: 0,
            recordedCount: 0,
            invitedGuestCount: 0,
            sharedRecordingCount: 0,
        },
    );
}
