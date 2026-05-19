/**
 * Typed same-origin client for Gracon meetings browser components.
 */
import type {
    CreateMeetingInviteInput,
    CreateMeetingInput,
    Meeting,
    MeetingInvite,
    MeetingRecording,
    MeetingStatus,
    MeetingStreamAccess,
} from './types';

interface ListMeetingsInput {
    status?: MeetingStatus;
    take?: number;
    cursor?: string;
}

interface ApiErrorPayload {
    message?: string;
    error?: string;
}

/**
 * Reads a safe user-facing error message from an API response.
 */
async function getErrorMessage(response: Response): Promise<string> {
    const payload = await response.json().catch(() => null) as ApiErrorPayload | null;
    return payload?.message ?? payload?.error ?? 'Unable to complete this request.';
}

/**
 * Executes a same-origin JSON request and returns a typed response.
 */
async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(path, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...init?.headers,
        },
        credentials: 'include',
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error(await getErrorMessage(response));
    }

    return response.json() as Promise<T>;
}

/**
 * Fetches meetings visible to the authenticated user.
 */
export function listMeetings(input: ListMeetingsInput = {}): Promise<Meeting[]> {
    const search = new URLSearchParams();
    if (input.status) search.set('status', input.status);
    if (input.take) search.set('take', String(input.take));
    if (input.cursor) search.set('cursor', input.cursor);

    const query = search.toString();
    return requestJson<Meeting[]>(query ? `/api/meetings?${query}` : '/api/meetings');
}

/**
 * Fetches all visible meetings through the paginated BFF route.
 *
 * The backend caps each page at 50 rows. This bounded loop keeps long lists
 * dynamic without making the browser depend on local seed data.
 */
export async function listAllVisibleMeetings(
    maxPages = 20,
    input: Pick<ListMeetingsInput, 'status'> = {},
): Promise<Meeting[]> {
    const meetings: Meeting[] = [];
    let cursor: string | undefined;

    for (let page = 0; page < maxPages; page += 1) {
        const pageItems = await listMeetings({ ...input, take: 50, cursor });
        meetings.push(...pageItems);

        if (pageItems.length < 50) break;

        cursor = pageItems[pageItems.length - 1]?.id;
        if (!cursor) break;
    }

    return meetings;
}

/**
 * Fetches one visible meeting through the same-origin BFF route.
 */
export function getMeeting(meetingId: string): Promise<Meeting> {
    return requestJson<Meeting>(`/api/meetings/${encodeURIComponent(meetingId)}`);
}

/**
 * Creates a scheduled or draft meeting through the local BFF route.
 */
export function createMeeting(input: CreateMeetingInput): Promise<Meeting> {
    return requestJson<Meeting>('/api/meetings', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

/**
 * Starts a meeting and creates the Stream call lazily on the backend.
 */
export function startMeeting(meetingId: string): Promise<Meeting> {
    return requestJson<Meeting>(`/api/meetings/${meetingId}/start`, {
        method: 'POST',
    });
}

/**
 * Ends a meeting through the protected backend.
 */
export function endMeeting(meetingId: string): Promise<Meeting> {
    return requestJson<Meeting>(`/api/meetings/${meetingId}/end`, {
        method: 'POST',
    });
}

/**
 * Requests a short-lived Stream token after Gracon permission checks pass.
 */
export function issueMeetingStreamToken(
    meetingId: string,
): Promise<MeetingStreamAccess> {
    return requestJson<MeetingStreamAccess>(`/api/meetings/${meetingId}/token`, {
        method: 'POST',
    });
}

/**
 * Lists recording metadata for one meeting through the local BFF route.
 */
export function listMeetingRecordings(meetingId: string): Promise<MeetingRecording[]> {
    return requestJson<MeetingRecording[]>(`/api/meetings/${meetingId}/recordings`);
}

export interface VisibleMeetingRecordings {
    recordings: MeetingRecording[];
    recordingsByMeetingId: Map<string, MeetingRecording[]>;
}

/**
 * Fetches recording metadata for visible meetings without failing the whole page
 * when one meeting has no accessible recording history.
 */
export async function listVisibleMeetingRecordings(
    meetings: Meeting[],
): Promise<VisibleMeetingRecordings> {
    const settledRecordings = await Promise.allSettled(
        meetings.map(async (meeting) => ({
            meetingId: meeting.id,
            recordings: await listMeetingRecordings(meeting.id),
        })),
    );
    const recordingsByMeetingId = new Map<string, MeetingRecording[]>();

    settledRecordings.forEach((result) => {
        if (result.status !== 'fulfilled') return;
        recordingsByMeetingId.set(result.value.meetingId, result.value.recordings);
    });

    return {
        recordings: Array.from(recordingsByMeetingId.values()).flat(),
        recordingsByMeetingId,
    };
}

/**
 * Starts a host-controlled meeting recording.
 */
export function startMeetingRecording(meetingId: string): Promise<MeetingRecording> {
    return requestJson<MeetingRecording>(`/api/meetings/${meetingId}/recordings/start`, {
        method: 'POST',
    });
}

/**
 * Stops the active host-controlled meeting recording.
 */
export function stopMeetingRecording(meetingId: string): Promise<MeetingRecording> {
    return requestJson<MeetingRecording>(`/api/meetings/${meetingId}/recordings/stop`, {
        method: 'POST',
    });
}

/**
 * Refreshes provider playback metadata for recordings that are still processing.
 */
export function refreshMeetingRecordings(meetingId: string): Promise<MeetingRecording[]> {
    return requestJson<MeetingRecording[]>(`/api/meetings/${meetingId}/recordings/refresh`, {
        method: 'POST',
    });
}

/**
 * Sends a meeting invitation with host-selected verification gates.
 */
export function createMeetingInvite(
    meetingId: string,
    input: CreateMeetingInviteInput,
): Promise<MeetingInvite> {
    return requestJson<MeetingInvite>(`/api/meetings/${meetingId}/invites`, {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

/**
 * Builds the local custom meeting-room route for a Gracon meeting id.
 *
 * Room title and host identity must be fetched from the API/session after the
 * route opens. Keeping them out of the URL prevents stale shared links from
 * rendering the wrong host.
 */
export function getMeetingJoinPath(meetingId: string): string {
    return `/meetings/${encodeURIComponent(meetingId)}`;
}
