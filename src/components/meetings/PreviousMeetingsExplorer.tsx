/**
 * Interactive previous meetings search, filters, and pagination.
 */
'use client';

import { FileDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { MeetingCardView } from '@/lib/meetings/static-meetings';
import { PaginatedMeetingGrid } from './PaginatedMeetingGrid';
import styles from './previous-meetings-explorer.module.css';

type PreviousFilter = 'all' | 'recorded' | 'month' | 'follow-up';

interface PreviousMeetingsExplorerProps {
    meetings: MeetingCardView[];
}

const FILTERS: Array<{ id: PreviousFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'recorded', label: 'Recorded' },
    { id: 'month', label: 'This month' },
    { id: 'follow-up', label: 'Needs follow-up' },
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
 * Checks if a meeting happened during the user's current local month.
 */
function isThisMonth(isoDate: string) {
    const meetingDate = new Date(isoDate);
    const now = new Date();
    return meetingDate.getFullYear() === now.getFullYear()
        && meetingDate.getMonth() === now.getMonth();
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
 * Renders completed meeting controls and paginated meeting results.
 */
export function PreviousMeetingsExplorer({ meetings }: PreviousMeetingsExplorerProps) {
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<PreviousFilter>('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const filteredMeetings = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return meetings.filter((meeting) => {
            if (normalizedSearch.length >= 3 && !meeting.title.toLowerCase().includes(normalizedSearch)) {
                return false;
            }

            if (activeFilter === 'recorded' && !meeting.hasRecording) {
                return false;
            }

            if (activeFilter === 'month' && !isThisMonth(meeting.scheduledStartAt)) {
                return false;
            }

            if (activeFilter === 'follow-up' && !meeting.needsFollowUp) {
                return false;
            }

            return isInsideDateRange(meeting.scheduledStartAt, fromDate, toDate);
        });
    }, [activeFilter, fromDate, meetings, search, toDate]);

    const searchHint = search.trim().length > 0 && search.trim().length < 3
        ? 'Type at least 3 characters to search by title.'
        : `${filteredMeetings.length.toLocaleString('en')} completed meeting${filteredMeetings.length === 1 ? '' : 's'} found`;

    return (
        <div className={styles.explorer}>
            <div className={styles.toolbar}>
                <label className={styles.searchField}>
                    <Search size={16} />
                    <span>Search previous meetings</span>
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by meeting title..."
                    />
                </label>

                <div className={styles.filters} aria-label="Previous meeting filters">
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

                <button type="button" className={styles.exportButton}>
                    <FileDown size={15} />
                    Export history
                </button>
            </div>

            <p className={styles.resultStatus}>{searchHint}</p>

            <div
                key={`${activeFilter}-${fromDate}-${toDate}-${search.trim().slice(0, 16)}-${filteredMeetings.length}`}
                className={styles.resultsMotion}
            >
                <PaginatedMeetingGrid
                    meetings={filteredMeetings}
                    pageSize={18}
                    ariaLabel="Completed meetings"
                />
            </div>
        </div>
    );
}
