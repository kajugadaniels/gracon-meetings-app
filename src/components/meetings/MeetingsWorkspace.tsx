/**
 * Interactive meetings workspace for scheduling and host actions.
 */
'use client';

import { CalendarClock, Copy, Play, Square, Video } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSessionUser } from '@/app/(protected)/layout';
import {
    createMeeting,
    endMeeting,
    getMeetingJoinPath,
    issueMeetingStreamToken,
    listMeetings,
    startMeeting,
} from '@/lib/meetings/api-client';
import type { Meeting, MeetingStreamAccess, MeetingVisibility } from '@/lib/meetings/types';
import { Button, Input } from '@/components/ui';
import styles from './meetings-workspace.module.css';

const VISIBILITY_OPTIONS: Array<{ label: string; value: MeetingVisibility }> = [
    { label: 'Invite only', value: 'INVITE_ONLY' },
    { label: 'Private', value: 'PRIVATE' },
    { label: 'Link access', value: 'LINK_ACCESS' },
];

function formatDate(value: string | null) {
    if (!value) return 'Not scheduled';
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

type PreparedMeetingStreamAccess = MeetingStreamAccess & { meetingId: string };

function getJoinLink(access: PreparedMeetingStreamAccess) {
    return getMeetingJoinPath(access.meetingId);
}

/**
 * Renders meeting creation, meeting list, and Stream token handoff controls.
 */
export function MeetingsWorkspace() {
    const user = useSessionUser();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [activeToken, setActiveToken] = useState<PreparedMeetingStreamAccess | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [scheduledStartAt, setScheduledStartAt] = useState('');
    const [scheduledEndAt, setScheduledEndAt] = useState('');
    const [visibility, setVisibility] = useState<MeetingVisibility>('INVITE_ONLY');
    const [recordingEnabled, setRecordingEnabled] = useState(false);

    const hostName = useMemo(() => {
        if (!user) return 'Host';
        return `${user.postNames} ${user.surName}`.trim() || user.email;
    }, [user]);

    useEffect(() => {
        let ignore = false;

        listMeetings()
            .then((items) => {
                if (!ignore) {
                    setMeetings(items);
                    setError(null);
                }
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
    }, []);

    /**
     * Creates a meeting and prepends it to the current list without reloading.
     */
    async function handleCreateMeeting(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError(null);
        setNotice(null);

        try {
            const meeting = await createMeeting({
                title,
                description: description || undefined,
                visibility,
                scheduledStartAt: scheduledStartAt
                    ? new Date(scheduledStartAt).toISOString()
                    : undefined,
                scheduledEndAt: scheduledEndAt
                    ? new Date(scheduledEndAt).toISOString()
                    : undefined,
                recordingEnabled,
                waitingRoomEnabled: true,
                joinBeforeHost: false,
            });

            setMeetings((current) => [meeting, ...current]);
            setTitle('');
            setDescription('');
            setScheduledStartAt('');
            setScheduledEndAt('');
            setRecordingEnabled(false);
            setNotice('Meeting created and audit log recorded.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to create meeting.');
        } finally {
            setSaving(false);
        }
    }

    /**
     * Runs a host action and updates the local list in place.
     */
    async function updateMeetingAction(
        meetingId: string,
        action: 'start' | 'end',
    ) {
        setError(null);
        setNotice(null);
        try {
            const updated =
                action === 'start'
                    ? await startMeeting(meetingId)
                    : await endMeeting(meetingId);
            setMeetings((current) =>
                current.map((meeting) => meeting.id === meetingId ? updated : meeting),
            );
            setNotice(action === 'start' ? 'Meeting started.' : 'Meeting ended.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to update meeting.');
        }
    }

    /**
     * Requests Stream call access only after api/meetings confirms authorization.
     */
    async function handlePrepareJoin(meetingId: string) {
        setError(null);
        setNotice(null);
        try {
            const access = await issueMeetingStreamToken(meetingId);
            setActiveToken({ ...access, meetingId });
            setNotice('Secure Stream join token issued.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to prepare join token.');
        }
    }

    return (
        <section className={styles.workspace}>
            <div className={styles.hero}>
                <div>
                    <p className={styles.eyebrow}>Secure meetings</p>
                    <h1 className={styles.title}>Host and schedule Gracon meetings.</h1>
                    <p className={styles.copy}>
                        Meetings are owned by Gracon, media tokens are issued through
                        api/meetings, and every host action is audit-ready.
                    </p>
                </div>
                <div className={styles.hostCard}>
                    <span className={styles.hostLabel}>Signed in as</span>
                    <strong>{hostName}</strong>
                    <span>{user?.email}</span>
                </div>
            </div>

            <div className={styles.columns}>
                <form className={styles.formCard} onSubmit={handleCreateMeeting}>
                    <div className={styles.cardHeader}>
                        <CalendarClock size={18} />
                        <div>
                            <h2>Create meeting</h2>
                            <p>Schedule now, start when you are ready.</p>
                        </div>
                    </div>

                    <Input
                        label="Meeting title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Board review"
                        required
                    />

                    <label className={styles.field}>
                        <span>Description</span>
                        <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="Agenda, goals, or joining notes"
                            rows={4}
                        />
                    </label>

                    <div className={styles.inlineFields}>
                        <Input
                            label="Starts"
                            type="datetime-local"
                            value={scheduledStartAt}
                            onChange={(event) => setScheduledStartAt(event.target.value)}
                        />
                        <Input
                            label="Ends"
                            type="datetime-local"
                            value={scheduledEndAt}
                            onChange={(event) => setScheduledEndAt(event.target.value)}
                        />
                    </div>

                    <label className={styles.field}>
                        <span>Access</span>
                        <select
                            value={visibility}
                            onChange={(event) =>
                                setVisibility(event.target.value as MeetingVisibility)
                            }
                        >
                            {VISIBILITY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className={styles.checkRow}>
                        <input
                            type="checkbox"
                            checked={recordingEnabled}
                            onChange={(event) => setRecordingEnabled(event.target.checked)}
                        />
                        <span>Allow recording for this meeting</span>
                    </label>

                    <Button type="submit" loading={saving} loadingText="Creating..." fullWidth>
                        Create meeting
                    </Button>
                </form>

                <div className={styles.listCard}>
                    <div className={styles.cardHeader}>
                        <Video size={18} />
                        <div>
                            <h2>Your meetings</h2>
                            <p>Start, end, or prepare a secure join token.</p>
                        </div>
                    </div>

                    {error && <p className={styles.error}>{error}</p>}
                    {notice && <p className={styles.notice}>{notice}</p>}

                    {activeToken && (
                        <div className={styles.tokenBox}>
                            <span>Join path prepared</span>
                            <code>{getJoinLink(activeToken)}</code>
                            <button
                                type="button"
                                onClick={() =>
                                    void navigator.clipboard?.writeText(getJoinLink(activeToken))
                                }
                            >
                                <Copy size={14} />
                                Copy
                            </button>
                            <Link href={getJoinLink(activeToken)}>Open room</Link>
                        </div>
                    )}

                    {loading ? (
                        <div className={styles.emptyState}>Loading meetings...</div>
                    ) : meetings.length === 0 ? (
                        <div className={styles.emptyState}>
                            No meetings yet. Create your first scheduled meeting.
                        </div>
                    ) : (
                        <div className={styles.meetingList}>
                            {meetings.map((meeting) => (
                                <article key={meeting.id} className={styles.meetingCard}>
                                    <div>
                                        <div className={styles.meetingTopline}>
                                            <span>{meeting.status.toLowerCase()}</span>
                                            <span>{meeting.visibility.replace('_', ' ').toLowerCase()}</span>
                                        </div>
                                        <h3>{meeting.title}</h3>
                                        <p>{meeting.description || 'No agenda added yet.'}</p>
                                        <time>{formatDate(meeting.scheduledStartAt)}</time>
                                    </div>
                                    <div className={styles.meetingActions}>
                                        <button
                                            type="button"
                                            onClick={() => void handlePrepareJoin(meeting.id)}
                                        >
                                            <Video size={14} />
                                            Join token
                                        </button>
                                        <button
                                            type="button"
                                            disabled={meeting.status === 'LIVE'}
                                            onClick={() => void updateMeetingAction(meeting.id, 'start')}
                                        >
                                            <Play size={14} />
                                            Start
                                        </button>
                                        <button
                                            type="button"
                                            disabled={meeting.status === 'ENDED'}
                                            onClick={() => void updateMeetingAction(meeting.id, 'end')}
                                        >
                                            <Square size={14} />
                                            End
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
