/**
 * Static meetings home dashboard.
 */
'use client';

import {
    CalendarDays,
    Clock3,
    Link2,
    Plus,
    Send,
    UserPlus,
    Video,
    X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ComponentType } from 'react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSessionUser } from '@/app/(protected)/layout';
import { MeetingCard } from './MeetingCard';
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

interface StaticMeeting {
    title: string;
    date: string;
    time: string;
    attendees: string[];
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

const STATIC_MEETINGS: StaticMeeting[] = [
    {
        title: 'Team Sync: Sprint Planning & Updates',
        date: 'Today',
        time: '10:00 AM',
        attendees: ['DK', 'OU', 'SM', 'AN'],
    },
    {
        title: 'Project Pulse Check: Weekly Standup',
        date: 'Today',
        time: '2:30 PM',
        attendees: ['DK', 'RN', 'IM', 'PK'],
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
export function MeetingsWorkspace() {
    const user = useSessionUser();
    const router = useRouter();
    const [showSkeleton, setShowSkeleton] = useState(true);
    const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
    const [joinUrl, setJoinUrl] = useState('');

    const hostName = useMemo(() => {
        if (!user) return 'Host';
        return `${user.postNames} ${user.surName}`.trim() || user.email;
    }, [user]);

    const today = useMemo(() => formatToday(), []);
    const clock = useMemo(() => formatCurrentTime(), []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => setShowSkeleton(false), 520);
        return () => window.clearTimeout(timeoutId);
    }, []);

    function closeDialog() {
        setActiveDialog(null);
    }

    function handleQuickAction(action: QuickAction) {
        if (action === 'recordings') {
            router.push('/recordings');
            return;
        }

        setActiveDialog(action);
    }

    function handleJoinMeeting(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        closeDialog();
    }

    function handleScheduleMeeting(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        closeDialog();
    }

    if (showSkeleton) {
        return <MeetingsHomeSkeleton />;
    }

    return (
        <section className={styles.workspace}>
            <section className={styles.hero} aria-label="Meetings overview">
                <div className={styles.nextMeetingBadge}>
                    Upcoming meeting at: <strong>12:30 PM</strong>
                </div>
                <div>
                    <div className={styles.clockRow}>
                        <span>{clock.time}</span>
                        <small>{clock.meridiem}</small>
                    </div>
                    <p className={styles.dateLine}>{today}</p>
                </div>
                <div className={styles.heroIdentity}>
                    <span>Signed in as</span>
                    <strong>{hostName}</strong>
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
                    <button type="button">See all</button>
                </div>

                <div className={styles.meetingGrid}>
                    {STATIC_MEETINGS.map((meeting) => (
                        <MeetingCard
                            key={meeting.title}
                            title={meeting.title}
                            date={meeting.date}
                            time={meeting.time}
                            attendees={meeting.attendees}
                            overflowCount={9}
                        />
                    ))}
                </div>
            </section>

            {activeDialog === 'new' && (
                <div className={styles.dialogOverlay} role="presentation">
                    <section
                        className={styles.dialog}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="new-meeting-title"
                    >
                        <div className={styles.dialogHeader}>
                            <div>
                                <p>New meeting</p>
                                <h2 id="new-meeting-title">Choose how this room should start.</h2>
                            </div>
                            <button
                                type="button"
                                className={styles.closeButton}
                                onClick={closeDialog}
                                aria-label="Close dialog"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <div className={styles.choiceGrid}>
                            <button type="button" onClick={closeDialog}>
                                <span><Video size={22} /></span>
                                <strong>Instant meeting</strong>
                                <small>Open a secure room now and invite people after it starts.</small>
                            </button>
                            <button type="button" onClick={() => setActiveDialog('schedule')}>
                                <span><CalendarDays size={22} /></span>
                                <strong>Scheduled meeting</strong>
                                <small>Prepare a title, date, time, and invited guests first.</small>
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {activeDialog === 'join' && (
                <div className={styles.dialogOverlay} role="presentation">
                    <section
                        className={styles.dialog}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="join-meeting-title"
                    >
                        <div className={styles.dialogHeader}>
                            <div>
                                <p>Join meeting</p>
                                <h2 id="join-meeting-title">Paste a Gracon meeting URL.</h2>
                            </div>
                            <button
                                type="button"
                                className={styles.closeButton}
                                onClick={closeDialog}
                                aria-label="Close dialog"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <form className={styles.dialogForm} onSubmit={handleJoinMeeting}>
                            <label className={styles.field}>
                                <span>Meeting URL</span>
                                <div className={styles.inputShell}>
                                    <Link2 size={16} />
                                    <input
                                        value={joinUrl}
                                        onChange={(event) => setJoinUrl(event.target.value)}
                                        placeholder="https://gracon360.com/meet/room-id"
                                        type="url"
                                        required
                                    />
                                </div>
                            </label>

                            <div className={styles.dialogActions}>
                                <button type="button" onClick={closeDialog}>Cancel</button>
                                <button type="submit">
                                    <Send size={15} />
                                    Join
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {activeDialog === 'schedule' && (
                <div className={styles.dialogOverlay} role="presentation">
                    <section
                        className={styles.dialog}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="schedule-meeting-title"
                    >
                        <div className={styles.dialogHeader}>
                            <div>
                                <p>Schedule meeting</p>
                                <h2 id="schedule-meeting-title">Prepare the meeting before guests join.</h2>
                            </div>
                            <button
                                type="button"
                                className={styles.closeButton}
                                onClick={closeDialog}
                                aria-label="Close dialog"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        <form className={styles.dialogForm} onSubmit={handleScheduleMeeting}>
                            <label className={styles.field}>
                                <span>Meeting title</span>
                                <input type="text" placeholder="Board review" required />
                            </label>
                            <div className={styles.formGrid}>
                                <label className={styles.field}>
                                    <span>Date</span>
                                    <input type="date" required />
                                </label>
                                <label className={styles.field}>
                                    <span>Time</span>
                                    <div className={styles.inputShell}>
                                        <Clock3 size={16} />
                                        <input type="time" required />
                                    </div>
                                </label>
                            </div>
                            <label className={styles.field}>
                                <span>Guests</span>
                                <input type="text" placeholder="emails separated by commas" />
                            </label>
                            <label className={styles.field}>
                                <span>Agenda</span>
                                <textarea placeholder="Add the main discussion points" rows={4} />
                            </label>

                            <div className={styles.dialogActions}>
                                <button type="button" onClick={closeDialog}>Cancel</button>
                                <button type="submit">
                                    <CalendarDays size={15} />
                                    Schedule
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </section>
    );
}
