/**
 * Interactive recordings search, filters, and pagination.
 */
'use client';

import { HardDrive, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { RecordingCardView } from '@/lib/meetings/static-meetings';
import { PaginatedRecordingGrid } from './PaginatedRecordingGrid';
import styles from './recordings-explorer.module.css';

type RecordingFilter = 'all' | 'ready' | 'shared' | 'month';

interface RecordingsExplorerProps {
    recordings: RecordingCardView[];
}

const FILTERS: Array<{ id: RecordingFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'ready', label: 'Ready' },
    { id: 'shared', label: 'Shared' },
    { id: 'month', label: 'This month' },
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
 * Checks if a recording was created during the user's current local month.
 */
function isThisMonth(isoDate: string) {
    const recordingDate = new Date(isoDate);
    const now = new Date();
    return recordingDate.getFullYear() === now.getFullYear()
        && recordingDate.getMonth() === now.getMonth();
}

/**
 * Checks if a recording is inside the inclusive custom date range.
 */
function isInsideDateRange(isoDate: string, fromDate: string, toDate: string) {
    const recordingDay = toDateInputValue(new Date(isoDate));
    if (fromDate && recordingDay < fromDate) return false;
    if (toDate && recordingDay > toDate) return false;
    return true;
}

/**
 * Renders recording controls and paginated recording results.
 */
export function RecordingsExplorer({ recordings }: RecordingsExplorerProps) {
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<RecordingFilter>('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const filteredRecordings = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return recordings.filter((recording) => {
            if (normalizedSearch.length >= 3 && !recording.title.toLowerCase().includes(normalizedSearch)) {
                return false;
            }

            if (activeFilter === 'ready' && recording.status !== 'Ready') {
                return false;
            }

            if (activeFilter === 'shared' && !recording.shared) {
                return false;
            }

            if (activeFilter === 'month' && !isThisMonth(recording.recordedAtIso)) {
                return false;
            }

            return isInsideDateRange(recording.recordedAtIso, fromDate, toDate);
        });
    }, [activeFilter, fromDate, recordings, search, toDate]);

    const searchHint = search.trim().length > 0 && search.trim().length < 3
        ? 'Type at least 3 characters to search by title.'
        : `${filteredRecordings.length.toLocaleString('en')} recording${filteredRecordings.length === 1 ? '' : 's'} found`;

    return (
        <div className={styles.explorer}>
            <div className={styles.toolbar}>
                <label className={styles.searchField}>
                    <Search size={16} />
                    <span>Search recordings</span>
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by recording title..."
                    />
                </label>

                <div className={styles.filters} aria-label="Recording filters">
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

                <div className={styles.dateRange} aria-label="Custom recording date range">
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

                <button type="button" className={styles.storageButton}>
                    <HardDrive size={15} />
                    Manage storage
                </button>
            </div>

            <p className={styles.resultStatus}>{searchHint}</p>

            <div
                key={`${activeFilter}-${fromDate}-${toDate}-${search.trim().slice(0, 16)}-${filteredRecordings.length}`}
                className={styles.resultsMotion}
            >
                <PaginatedRecordingGrid
                    recordings={filteredRecordings}
                    pageSize={18}
                    ariaLabel="Recorded meetings"
                />
            </div>
        </div>
    );
}
