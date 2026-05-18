/**
 * Stream-backed live room for a Gracon meeting.
 */
'use client';

import {
    CallControls,
    SpeakerLayout,
    StreamCall,
    StreamVideo,
    StreamVideoClient,
} from '@stream-io/video-react-sdk';
import { ArrowLeft, Circle, Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MeetingsLoadingState } from '@/components/ui/MeetingsLoadingState';
import {
    issueMeetingStreamToken,
    listMeetingRecordings,
    startMeetingRecording,
    stopMeetingRecording,
} from '@/lib/meetings/api-client';
import type { MeetingRecording, MeetingStreamAccess } from '@/lib/meetings/types';
import styles from './meeting-room.module.css';

interface MeetingRoomProps {
    meetingId: string;
}

/**
 * Joins a Stream call after api/meetings issues a call-scoped token.
 */
export function MeetingRoom({ meetingId }: MeetingRoomProps) {
    const [access, setAccess] = useState<MeetingStreamAccess | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recording, setRecording] = useState<MeetingRecording | null>(null);
    const [recordingBusy, setRecordingBusy] = useState(false);
    const [recordingMessage, setRecordingMessage] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;

        issueMeetingStreamToken(meetingId)
            .then((token) => {
                if (!ignore) setAccess(token);
            })
            .catch((err: Error) => {
                if (!ignore) setError(err.message);
            })
            .finally(() => {
                if (!ignore) setLoading(false);
            });

        return () => {
            ignore = true;
        };
    }, [meetingId]);

    const client = useMemo(() => {
        if (!access) return null;
        return StreamVideoClient.getOrCreateInstance({
            apiKey: access.apiKey,
            user: { id: access.userId },
            token: access.token,
        });
    }, [access]);

    const call = useMemo(() => {
        if (!client || !access) return null;
        return client.call(access.callType, access.callId);
    }, [access, client]);

    useEffect(() => {
        if (!call) return;

        let mounted = true;

        call.join({ create: false }).catch(() => {
            if (mounted) {
                setError('Unable to join the meeting room right now.');
            }
        });

        return () => {
            mounted = false;
            void call.leave();
        };
    }, [call]);

    useEffect(() => {
        let ignore = false;

        listMeetingRecordings(meetingId)
            .then((recordings) => {
                if (ignore) return;
                const activeRecording = recordings.find((entry) =>
                    entry.status === 'STARTING' || entry.status === 'RECORDING'
                );
                setRecording(activeRecording ?? null);
            })
            .catch(() => {
                if (!ignore) {
                    setRecordingMessage('Recording state could not be loaded.');
                }
            });

        return () => {
            ignore = true;
        };
    }, [meetingId]);

    /**
     * Toggles recording through Gracon so the host action is audited server-side.
     */
    async function handleToggleRecording() {
        if (recordingBusy) return;

        setRecordingBusy(true);
        setRecordingMessage(null);

        try {
            const nextRecording = recording
                ? await stopMeetingRecording(meetingId)
                : await startMeetingRecording(meetingId);

            setRecording(
                nextRecording.status === 'RECORDING' || nextRecording.status === 'STARTING'
                    ? nextRecording
                    : null,
            );
            setRecordingMessage(
                nextRecording.status === 'PROCESSING'
                    ? 'Recording stopped. The file is processing.'
                    : 'Recording started and audit logged.',
            );
        } catch (err) {
            setRecordingMessage(
                err instanceof Error
                    ? err.message
                    : 'Unable to update recording right now.',
            );
        } finally {
            setRecordingBusy(false);
        }
    }

    if (loading) {
        return (
            <MeetingsLoadingState
                title="Preparing secure room..."
                copy="Requesting a short-lived meeting token from Gracon."
                detail="Call-scoped token only"
            />
        );
    }

    if (error || !client || !call) {
        return (
            <section className={styles.stateShell}>
                <div className={styles.stateCard}>
                    <h1>Unable to open meeting</h1>
                    <p>{error ?? 'The meeting room could not be prepared.'}</p>
                    <Link href="/meetings" className={styles.backLink}>
                        <ArrowLeft size={15} />
                        Back to meetings
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.roomShell}>
            <header className={styles.roomHeader}>
                <Link href="/meetings" className={styles.backLink}>
                    <ArrowLeft size={15} />
                    Meetings
                </Link>
                <div className={styles.headerActions}>
                    <button
                        type="button"
                        className={`${styles.recordingButton} ${recording ? styles.recordingButtonActive : ''}`}
                        disabled={recordingBusy}
                        onClick={handleToggleRecording}
                    >
                        {recordingBusy ? (
                            <Loader2 size={15} className={styles.spinIcon} />
                        ) : (
                            <Circle size={12} fill="currentColor" />
                        )}
                        {recording ? 'Stop recording' : 'Record'}
                    </button>
                    <div className={styles.secureBadge}>
                        <ShieldCheck size={15} />
                        Token scoped to this room
                    </div>
                </div>
            </header>

            {recordingMessage && (
                <p
                    className={`${styles.roomNotice} ${
                        recordingMessage.toLowerCase().includes('unable') ||
                        recordingMessage.toLowerCase().includes('could not')
                            ? styles.roomNoticeError
                            : ''
                    }`}
                    role="status"
                >
                    {recordingMessage}
                </p>
            )}

            <div className={styles.roomCanvas}>
                <StreamVideo client={client}>
                    <StreamCall call={call}>
                        <SpeakerLayout />
                        <CallControls />
                    </StreamCall>
                </StreamVideo>
            </div>
        </section>
    );
}
