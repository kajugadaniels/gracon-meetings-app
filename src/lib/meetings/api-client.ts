/**
 * Typed same-origin client for Gracon meetings browser components.
 */
import type {
    CreateMeetingInput,
    Meeting,
    MeetingRecording,
    MeetingStreamAccess,
} from './types';

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
export function listMeetings(): Promise<Meeting[]> {
    return requestJson<Meeting[]>('/api/meetings');
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
 * Builds the local custom meeting-room route for a Gracon meeting id.
 */
export function getMeetingJoinPath(meetingId: string, title?: string): string {
    const path = `/meetings/${encodeURIComponent(meetingId)}`;
    if (!title) return path;

    return `${path}?title=${encodeURIComponent(title)}`;
}
