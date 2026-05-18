/**
 * Client-side pagination for reusable recording cards.
 */
'use client';

import { useMemo, useState } from 'react';
import type { RecordingCardView } from '@/lib/meetings/static-meetings';
import { RecordingCard } from './RecordingCard';
import styles from './paginated-recording-grid.module.css';

interface PaginatedRecordingGridProps {
    recordings: RecordingCardView[];
    pageSize?: number;
    ariaLabel: string;
}

/**
 * Renders recorded meetings in fixed-size pages for library-style browsing.
 */
export function PaginatedRecordingGrid({
    recordings,
    pageSize = 18,
    ariaLabel,
}: PaginatedRecordingGridProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.max(Math.ceil(recordings.length / pageSize), 1);

    const visibleRecordings = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return recordings.slice(start, start + pageSize);
    }, [currentPage, pageSize, recordings]);

    function goToPreviousPage() {
        setCurrentPage((page) => Math.max(page - 1, 1));
    }

    function goToNextPage() {
        setCurrentPage((page) => Math.min(page + 1, totalPages));
    }

    return (
        <div className={styles.wrapper}>
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
