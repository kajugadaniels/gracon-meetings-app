/**
 * Shared browser-safe meeting contracts used by app/meetings.
 */
export type MeetingStatus = 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
export type MeetingVisibility = 'PRIVATE' | 'INVITE_ONLY' | 'LINK_ACCESS';

export interface MeetingParticipant {
    id: string;
    meetingId: string;
    userId: string | null;
    email: string;
    displayName: string | null;
    role: 'HOST' | 'CO_HOST' | 'PARTICIPANT' | 'VIEWER';
    status: 'INVITED' | 'ACCEPTED' | 'DECLINED' | 'JOINED' | 'LEFT' | 'REMOVED';
    joinedAt: string | null;
    leftAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Meeting {
    id: string;
    ownerId: string;
    title: string;
    description: string | null;
    status: MeetingStatus;
    visibility: MeetingVisibility;
    streamCallType: string;
    streamCallId: string;
    scheduledStartAt: string | null;
    scheduledEndAt: string | null;
    startedAt: string | null;
    endedAt: string | null;
    recordingEnabled: boolean;
    waitingRoomEnabled: boolean;
    joinBeforeHost: boolean;
    createdAt: string;
    updatedAt: string;
    participants?: MeetingParticipant[];
}

export interface CreateMeetingInput {
    title: string;
    description?: string;
    visibility?: MeetingVisibility;
    scheduledStartAt?: string;
    scheduledEndAt?: string;
    recordingEnabled?: boolean;
    waitingRoomEnabled?: boolean;
    joinBeforeHost?: boolean;
}

export interface UpdateMeetingInput {
    title?: string;
    description?: string;
    visibility?: MeetingVisibility;
    scheduledStartAt?: string;
    scheduledEndAt?: string;
    recordingEnabled?: boolean;
    waitingRoomEnabled?: boolean;
    joinBeforeHost?: boolean;
}

export interface MeetingStreamAccess {
    apiKey: string;
    userId: string;
    callType: string;
    callId: string;
    token: string;
    expiresInSeconds: number;
}

export type MeetingRecordingStatus =
    | 'STARTING'
    | 'RECORDING'
    | 'PROCESSING'
    | 'READY'
    | 'FAILED'
    | 'DELETED';

export interface MeetingRecording {
    id: string;
    meetingId: string;
    startedById: string | null;
    status: MeetingRecordingStatus;
    provider: 'STREAM';
    providerRecordingId: string | null;
    providerAssetUrl: string | null;
    s3Key: string | null;
    durationSeconds: number | null;
    sizeBytes: number | null;
    startedAt: string | null;
    endedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export type MeetingInviteVerificationRequirement =
    | 'EMAIL_OTP'
    | 'IDENTITY_VERIFICATION';

export interface CreateMeetingInviteInput {
    email: string;
    invitedUserId?: string;
    requiredVerifications?: MeetingInviteVerificationRequirement[];
    note?: string;
}

export interface MeetingInvite {
    id: string;
    meetingId: string;
    email: string;
    requiredVerifications: MeetingInviteVerificationRequirement[];
    expiresAt: string;
    emailSent?: boolean;
}

export interface MeetingUserSearchResult {
    id: string;
    email: string;
    displayName: string;
    initials: string;
    imageUrl: string | null;
}
