/**
 * Client-side pagination for reusable recording cards.
 */
'use client';

import { useMemo, useState } from 'react';
import type { RecordingCardView } from '@/lib/meetings/meeting-view-models';
import { RecordingCard } from './RecordingCard';
import styles from './paginated-recording-grid.module.css';

interface PaginatedRecordingGridProps {
    recordings: RecordingCardView[];
    pageSize?: number;
    ariaLabel: string;
    loading?: boolean;
}

/**
 * Renders recorded meetings in fixed-size pages for library-style browsing.
 */
export function PaginatedRecordingGrid({
    recordings,
    pageSize = 18,
    ariaLabel,
    loading = false,
}: PaginatedRecordingGridProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.max(Math.ceil(recordings.length / pageSize), 1);
    const activePage = Math.min(currentPage, totalPages);

    const visibleRecordings = useMemo(() => {
        const start = (activePage - 1) * pageSize;
        return recordings.slice(start, start + pageSize);
    }, [activePage, pageSize, recordings]);

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
            ) : visibleRecordings.length > 0 ? (
                <div className={styles.grid} aria-label={ariaLabel}>
                    {visibleRecordings.map((recording) => (
                        <RecordingCard
                            key={recording.id}
                            title={recording.title}
                            recordedAt={recording.recordedAt}
                            duration={recording.duration}
                            size={recording.size}
                            status={recording.status}
                            owner={recording.owner}
                        />
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState} role="status">
                    <strong>No recordings found</strong>
                    <span>Adjust the search, sharing, or date filters to find another recording.</span>
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
