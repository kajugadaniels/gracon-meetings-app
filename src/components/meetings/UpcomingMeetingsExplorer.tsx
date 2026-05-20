/**
 * Interactive upcoming meetings search, filters, and pagination.
 */
'use client';

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from '@/components/ui';
import type { MeetingCardView } from '@/lib/meetings/meeting-view-models';
import type { Meeting } from '@/lib/meetings/types';
import { deleteScheduledMeeting } from '@/lib/meetings/api-client';
import { DeleteScheduledMeetingDialog } from './DeleteScheduledMeetingDialog';
import { PaginatedMeetingGrid } from './PaginatedMeetingGrid';
import { ScheduleMeetingDialog } from './ScheduleMeetingDialog';
import { UpcomingScheduleButton } from './UpcomingScheduleButton';
import styles from './upcoming-meetings-explorer.module.css';

type UpcomingFilter = 'all' | 'today' | 'week' | 'invite';

interface UpcomingMeetingsExplorerProps {
    meetings: MeetingCardView[];
    sourceMeetings?: Meeting[];
    currentUserId?: string;
    loading?: boolean;
    onMeetingUpdated?: (meeting: Meeting) => void;
    onMeetingDeleted?: (meetingId: string) => void;
}

const FILTERS: Array<{ id: UpcomingFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This week' },
    { id: 'invite', label: 'Invite only' },
];

/**
 * Converts a date into a local date-only input value without UTC day drift.
 */
function toDateInputValue(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Checks if a meeting occurs within the user's current local day.
 */
function isToday(isoDate: string) {
    return toDateInputValue(new Date(isoDate)) === toDateInputValue(new Date());
}

/**
 * Checks if a meeting occurs within the next seven calendar days.
 */
function isWithinThisWeek(isoDate: string) {
    const meetingTime = new Date(isoDate).getTime();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const nextWeekEnd = todayStart + (7 * 24 * 60 * 60 * 1000);
    return meetingTime >= todayStart && meetingTime < nextWeekEnd;
}

/**
 * Checks if a meeting is inside the inclusive custom date range.
 */
function isInsideDateRange(isoDate: string, fromDate: string, toDate: string) {
    const meetingDay = toDateInputValue(new Date(isoDate));
    if (fromDate && meetingDay < fromDate) return false;
    if (toDate && meetingDay > toDate) return false;
    return true;
}

/**
 * Renders the upcoming meeting controls and paginated meeting results.
 */
export function UpcomingMeetingsExplorer({
    meetings,
    sourceMeetings = [],
    currentUserId,
    loading = false,
    onMeetingUpdated,
    onMeetingDeleted,
}: UpcomingMeetingsExplorerProps) {
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<UpcomingFilter>('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
    const [deleteCandidate, setDeleteCandidate] = useState<MeetingCardView | null>(null);
    const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);
    const sourceMeetingById = useMemo(() => (
        new Map(sourceMeetings.map((meeting) => [meeting.id, meeting]))
    ), [sourceMeetings]);
    const ownerEditableMeetings = useMemo(() => new Set(
        sourceMeetings
            .filter((meeting) => meeting.ownerId === currentUserId)
            .map((meeting) => meeting.id),
    ), [currentUserId, sourceMeetings]);

    const filteredMeetings = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return meetings.filter((meeting) => {
            if (normalizedSearch.length >= 3 && !meeting.title.toLowerCase().includes(normalizedSearch)) {
                return false;
            }

            if (activeFilter === 'today' && !isToday(meeting.scheduledStartAt)) {
                return false;
            }

            if (activeFilter === 'week' && !isWithinThisWeek(meeting.scheduledStartAt)) {
                return false;
            }

            if (activeFilter === 'invite' && meeting.visibility !== 'INVITE_ONLY') {
                return false;
            }

            return isInsideDateRange(meeting.scheduledStartAt, fromDate, toDate);
        });
    }, [activeFilter, fromDate, meetings, search, toDate]);

    const searchHint = search.trim().length > 0 && search.trim().length < 3
        ? 'Type at least 3 characters to search by title.'
        : loading
            ? 'Loading meetings from the secure backend...'
            : `${filteredMeetings.length.toLocaleString('en')} meeting${filteredMeetings.length === 1 ? '' : 's'} found`;

    /**
     * Deletes a future scheduled meeting after explicit confirmation.
     */
    async function handleDeleteMeeting(meeting: MeetingCardView) {
        const sourceMeeting = sourceMeetingById.get(meeting.id);
        if (!sourceMeeting || sourceMeeting.ownerId !== currentUserId) return;

        setDeletingMeetingId(meeting.id);

        try {
            await deleteScheduledMeeting(meeting.id);
            onMeetingDeleted?.(meeting.id);
            toast.success('Scheduled meeting deleted', {
                description: 'The meeting was removed from upcoming schedules.',
            });
            setDeleteCandidate(null);
        } catch (err) {
            toast.error('Unable to delete meeting', {
                description: err instanceof Error
                    ? err.message
                    : 'Try again or refresh the meeting list.',
            });
        } finally {
            setDeletingMeetingId(null);
        }
    }

    return (
        <div className={styles.explorer}>
            <div className={styles.toolbar}>
                <label className={styles.searchField}>
                    <Search size={16} />
                    <span>Search meetings</span>
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by meeting title..."
                    />
                </label>

                <div className={styles.filters} aria-label="Meeting filters">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter.id}
                            type="button"
                            className={activeFilter === filter.id ? styles.activeFilter : undefined}
                            onClick={() => setActiveFilter(filter.id)}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                <div className={styles.dateRange} aria-label="Custom date range">
                    <label>
                        <span>From</span>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(event) => setFromDate(event.target.value)}
                        />
                    </label>
                    <label>
                        <span>To</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(event) => setToDate(event.target.value)}
                        />
                    </label>
                </div>

                <UpcomingScheduleButton />
            </div>

            <p className={styles.resultStatus}>{searchHint}</p>

            <div
                key={`${activeFilter}-${fromDate}-${toDate}-${search.trim().slice(0, 16)}-${filteredMeetings.length}`}
                className={styles.resultsMotion}
            >
                <PaginatedMeetingGrid
                    meetings={filteredMeetings}
                    pageSize={18}
                    ariaLabel="Scheduled meetings"
                    loading={loading}
                    canEditMeeting={(meeting) => ownerEditableMeetings.has(meeting.id)}
                    onEditMeeting={(meeting) => {
                        const sourceMeeting = sourceMeetingById.get(meeting.id);
                        if (sourceMeeting && sourceMeeting.ownerId === currentUserId) {
                            setEditingMeeting(sourceMeeting);
                        }
                    }}
                    canDeleteMeeting={(meeting) => ownerEditableMeetings.has(meeting.id)}
                    onDeleteMeeting={(meeting) => {
                        if (ownerEditableMeetings.has(meeting.id)) {
                            setDeleteCandidate(meeting);
                        }
                    }}
                    deletingMeetingId={deletingMeetingId}
                />
            </div>

            {editingMeeting && (
                <ScheduleMeetingDialog
                    meeting={editingMeeting}
                    onClose={() => setEditingMeeting(null)}
                    onUpdated={(updatedMeeting) => {
                        onMeetingUpdated?.(updatedMeeting);
                        setEditingMeeting(null);
                    }}
                />
            )}

            {deleteCandidate && (
                <DeleteScheduledMeetingDialog
                    meetingTitle={deleteCandidate.title}
                    deleting={deletingMeetingId === deleteCandidate.id}
                    onCancel={() => {
                        if (!deletingMeetingId) setDeleteCandidate(null);
                    }}
                    onConfirm={() => void handleDeleteMeeting(deleteCandidate)}
                />
            )}
        </div>
    );
}
