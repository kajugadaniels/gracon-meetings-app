/**
 * Static meetings home dashboard.
 */
'use client';

import {
    CalendarDays,
    Plus,
    UserPlus,
    Video,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSessionUser } from '@/app/(protected)/layout';
import {
    createMeeting,
    getMeetingJoinPath,
    startMeeting,
} from '@/lib/meetings/api-client';
import type { MeetingCardView } from '@/lib/meetings/static-meetings';
import { JoinMeetingDialog } from './JoinMeetingDialog';
import { MeetingCard } from './MeetingCard';
import { NewMeetingDialog } from './NewMeetingDialog';
import { ScheduleMeetingDialog } from './ScheduleMeetingDialog';
import styles from './meetings-workspace.module.css';

type QuickAction = 'new' | 'join' | 'schedule' | 'recordings';
type ActiveDialog = Exclude<QuickAction, 'recordings'> | null;

interface ActionCard {
    title: string;
    copy: string;
    tone: 'coral' | 'blue' | 'purple' | 'amber';
    icon: ComponentType<{ size?: number; strokeWidth?: number }>;
    action: QuickAction;
}

interface MeetingsWorkspaceProps {
    meetings: MeetingCardView[];
}

const ACTION_CARDS: ActionCard[] = [
    {
        title: 'New Meeting',
        copy: 'Start a secure room now',
        tone: 'coral',
        icon: Plus,
        action: 'new',
    },
    {
        title: 'Join Meeting',
        copy: 'Use an invitation link',
        tone: 'blue',
        icon: UserPlus,
        action: 'join',
    },
    {
        title: 'Schedule Meeting',
        copy: 'Plan with invited guests',
        tone: 'purple',
        icon: CalendarDays,
        action: 'schedule',
    },
    {
        title: 'View Recordings',
        copy: 'Review saved sessions',
        tone: 'amber',
        icon: Video,
        action: 'recordings',
    },
];

function formatToday() {
    return new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(new Date());
}

function formatCurrentTime() {
    const parts = new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).formatToParts(new Date());

    return {
        time: `${parts.find((part) => part.type === 'hour')?.value ?? '12'}:${parts.find((part) => part.type === 'minute')?.value ?? '00'}`,
        meridiem: parts.find((part) => part.type === 'dayPeriod')?.value ?? 'PM',
    };
}

/**
 * Renders a temporary skeleton so the home surface feels loaded intentionally.
 */
function MeetingsHomeSkeleton() {
    return (
        <section className={styles.workspace} aria-label="Loading meetings home">
            <div className={`${styles.skeletonBlock} ${styles.skeletonHero}`} />
            <div className={styles.skeletonActions}>
                <div className={styles.skeletonBlock} />
                <div className={styles.skeletonBlock} />
                <div className={styles.skeletonBlock} />
                <div className={styles.skeletonBlock} />
            </div>
            <div className={styles.skeletonHeader}>
                <div className={styles.skeletonLineWide} />
                <div className={styles.skeletonLineShort} />
            </div>
            <div className={styles.meetingGrid}>
                <div className={`${styles.skeletonBlock} ${styles.skeletonMeeting}`} />
                <div className={`${styles.skeletonBlock} ${styles.skeletonMeeting}`} />
            </div>
        </section>
    );
}

/**
 * Renders the static home dashboard shown after protected session recovery.
 */
export function MeetingsWorkspace({ meetings }: MeetingsWorkspaceProps) {
    const user = useSessionUser();
    const router = useRouter();
    const [showSkeleton, setShowSkeleton] = useState(true);
    const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
    const [joinUrl, setJoinUrl] = useState('');
    const [instantStarting, setInstantStarting] = useState(false);
    const [instantError, setInstantError] = useState<string | null>(null);

    const hostName = useMemo(() => {
        if (!user) return 'Host';
        return `${user.postNames} ${user.surName}`.trim() || user.email;
    }, [user]);

    const today = useMemo(() => formatToday(), []);
    const clock = useMemo(() => formatCurrentTime(), []);
    const nextMeeting = meetings[0];

    useEffect(() => {
        const timeoutId = window.setTimeout(() => setShowSkeleton(false), 520);
        return () => window.clearTimeout(timeoutId);
    }, []);

    function closeDialog() {
        setActiveDialog(null);
        setInstantError(null);
    }

    function handleQuickAction(action: QuickAction) {
        if (action === 'recordings') {
            router.push('/recordings');
            return;
        }

        setActiveDialog(action);
    }

    /**
     * Creates and starts an instant Gracon meeting before entering the live room.
     */
    async function handleInstantMeetingStart() {
        if (instantStarting) return;

        setInstantStarting(true);
        setInstantError(null);

        try {
            const createdMeeting = await createMeeting({
                title: `Instant meeting with ${hostName}`,
                description: 'Instant secure meeting room.',
                visibility: 'INVITE_ONLY',
                recordingEnabled: false,
                waitingRoomEnabled: true,
                joinBeforeHost: false,
            });
            const liveMeeting = await startMeeting(createdMeeting.id);
            router.push(getMeetingJoinPath(liveMeeting.id));
        } catch (err) {
            setInstantError(
                err instanceof Error
                    ? err.message
                    : 'Unable to start an instant meeting right now.',
            );
        } finally {
            setInstantStarting(false);
        }
    }

    if (showSkeleton) {
        return <MeetingsHomeSkeleton />;
    }

    return (
        <section className={styles.workspace}>
            <section className={styles.hero} aria-label="Meetings overview">
                <div className={styles.heroMain}>
                    <div className={styles.nextMeetingBadge}>
                        Next room opens at <strong>{nextMeeting?.time ?? 'Ready'}</strong>
                    </div>

                    <div>
                        <div className={styles.clockRow}>
                            <span>{clock.time}</span>
                            <small>{clock.meridiem}</small>
                        </div>
                        <p className={styles.dateLine}>{today}</p>
                    </div>
                </div>

                <div className={styles.heroPanel}>
                    <div className={styles.heroIdentity}>
                        <span>Signed in as</span>
                        <strong>{hostName}</strong>
                    </div>
                    <dl className={styles.heroStats}>
                        <div>
                            <dt>Today</dt>
                            <dd>{meetings.length} rooms</dd>
                        </div>
                        <div>
                            <dt>Ready</dt>
                            <dd>2 invites</dd>
                        </div>
                    </dl>
                </div>
            </section>

            <section className={styles.actionGrid} aria-label="Meeting quick actions">
                {ACTION_CARDS.map((card) => {
                    const Icon = card.icon;
                    return (
                        <button
                            key={card.title}
                            type="button"
                            className={`${styles.actionCard} ${styles[card.tone]}`}
                            onClick={() => handleQuickAction(card.action)}
                        >
                            <span className={styles.actionIcon}>
                                <Icon size={30} strokeWidth={2.4} />
                            </span>
                            <span className={styles.actionText}>
                                <strong>{card.title}</strong>
                                <small>{card.copy}</small>
                            </span>
                        </button>
                    );
                })}
            </section>

            <section className={styles.upcomingSection} aria-labelledby="today-meetings">
                <div className={styles.sectionHeader}>
                    <h1 id="today-meetings" className={styles.title}>
                        Today&apos;s Upcoming Meetings
                    </h1>
                    <button type="button" onClick={() => router.push('/upcoming')}>
                        See all
                    </button>
                </div>

                <div className={styles.meetingGrid}>
                    {meetings.map((meeting) => (
                        <MeetingCard
                            key={meeting.id}
                            title={meeting.title}
                            date={meeting.date}
                            time={meeting.time}
                            attendees={meeting.attendees}
                            overflowCount={meeting.overflowCount}
                            meetingId={meeting.id}
                        />
                    ))}
                </div>
            </section>

            {activeDialog === 'new' && (
                <NewMeetingDialog
                    error={instantError}
                    instantStarting={instantStarting}
                    onClose={closeDialog}
                    onInstantStart={handleInstantMeetingStart}
                    onSchedule={() => setActiveDialog('schedule')}
                />
            )}

            {activeDialog === 'join' && (
                <JoinMeetingDialog
                    joinUrl={joinUrl}
                    onClose={closeDialog}
                    onJoinUrlChange={setJoinUrl}
                />
            )}

            {activeDialog === 'schedule' && (
                <ScheduleMeetingDialog onClose={closeDialog} />
            )}
        </section>
    );
}
