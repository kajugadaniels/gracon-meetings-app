/**
 * Client-side pagination for reusable meeting cards.
 */
'use client';

import { useMemo, useState } from 'react';
import type { MeetingCardView } from '@/lib/meetings/meeting-view-models';
import { MeetingCard } from './MeetingCard';
import styles from './paginated-meeting-grid.module.css';

interface PaginatedMeetingGridProps {
    meetings: MeetingCardView[];
    pageSize?: number;
    ariaLabel: string;
    loading?: boolean;
    showActions?: boolean;
}

/**
 * Renders meeting cards in fixed-size pages so long static lists stay easy to scan.
 */
export function PaginatedMeetingGrid({
    meetings,
    pageSize = 18,
    ariaLabel,
    loading = false,
    showActions = true,
}: PaginatedMeetingGridProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.max(Math.ceil(meetings.length / pageSize), 1);
    const activePage = Math.min(currentPage, totalPages);

    const visibleMeetings = useMemo(() => {
        const start = (activePage - 1) * pageSize;
        return meetings.slice(start, start + pageSize);
    }, [activePage, meetings, pageSize]);

    function goToPreviousPage() {
        setCurrentPage(Math.max(activePage - 1, 1));
    }

    function goToNextPage() {
        setCurrentPage(Math.min(activePage + 1, totalPages));
    }

    return (
        <div className={styles.wrapper}>
            {loading ? (
                <div className={styles.grid} aria-label={`${ariaLabel} loading`}>
                    {Array.from({ length: 6 }, (_, index) => (
                        <div key={index} className={styles.skeletonCard} />
                    ))}
                </div>
            ) : visibleMeetings.length > 0 ? (
                <div className={styles.grid} aria-label={ariaLabel}>
                    {visibleMeetings.map((meeting) => (
                        <MeetingCard
                            key={meeting.id}
                            title={meeting.title}
                            status={meeting.status}
                            date={meeting.date}
                            time={meeting.time}
                            scheduledStartAt={meeting.scheduledStartAt}
                            attendees={meeting.attendees}
                            overflowCount={meeting.overflowCount}
                            meetingId={meeting.id}
                            durationLabel={meeting.durationLabel}
                            showActions={showActions}
                        />
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState} role="status">
                    <strong>No meetings found</strong>
                    <span>Adjust the search or date filters to see more scheduled rooms.</span>
                </div>
            )}

            {totalPages > 1 && (
                <nav className={styles.pagination} aria-label={`${ariaLabel} pagination`}>
                    <button
                        type="button"
                        onClick={goToPreviousPage}
                        disabled={activePage === 1}
                    >
                        Previous
                    </button>
                    <span>
                        Page {activePage} of {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={goToNextPage}
                        disabled={activePage === totalPages}
                    >
                        Next
                    </button>
                </nav>
            )}
        </div>
    );
}
