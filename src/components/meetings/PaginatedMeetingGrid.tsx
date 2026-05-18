/**
 * Client-side pagination for reusable meeting cards.
 */
'use client';

import { useMemo, useState } from 'react';
import type { MeetingCardView } from '@/lib/meetings/static-meetings';
import { MeetingCard } from './MeetingCard';
import styles from './paginated-meeting-grid.module.css';

interface PaginatedMeetingGridProps {
    meetings: MeetingCardView[];
    pageSize?: number;
    ariaLabel: string;
}

/**
 * Renders meeting cards in fixed-size pages so long static lists stay easy to scan.
 */
export function PaginatedMeetingGrid({
    meetings,
    pageSize = 18,
    ariaLabel,
}: PaginatedMeetingGridProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.max(Math.ceil(meetings.length / pageSize), 1);

    const visibleMeetings = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return meetings.slice(start, start + pageSize);
    }, [currentPage, meetings, pageSize]);

    function goToPreviousPage() {
        setCurrentPage((page) => Math.max(page - 1, 1));
    }

    function goToNextPage() {
        setCurrentPage((page) => Math.min(page + 1, totalPages));
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.grid} aria-label={ariaLabel}>
                {visibleMeetings.map((meeting) => (
                    <MeetingCard
                        key={meeting.id}
                        title={meeting.title}
                        date={meeting.date}
                        time={meeting.time}
                        attendees={meeting.attendees}
                        overflowCount={meeting.overflowCount}
                    />
                ))}
            </div>

            {totalPages > 1 && (
                <nav className={styles.pagination} aria-label={`${ariaLabel} pagination`}>
                    <button
                        type="button"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </nav>
            )}
        </div>
    );
}
