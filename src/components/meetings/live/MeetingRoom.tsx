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
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MeetingsLoadingState } from '@/components/ui/MeetingsLoadingState';
import { issueMeetingStreamToken } from '@/lib/meetings/api-client';
import type { MeetingStreamAccess } from '@/lib/meetings/types';
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
                <div className={styles.secureBadge}>
                    <ShieldCheck size={15} />
                    Token scoped to this room
                </div>
            </header>

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
