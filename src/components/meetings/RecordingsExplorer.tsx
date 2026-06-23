/**
 * Interactive recordings search, filters, and pagination.
 */
'use client';

import { HardDrive, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { RecordingCardView } from '@/lib/meetings/meeting-view-models';
import { toast } from '@/components/ui';
import { PaginatedRecordingGrid } from './PaginatedRecordingGrid';
import { RecordingPlayerDialog } from './RecordingPlayerDialog';
import styles from './recordings-explorer.module.css';

type RecordingFilter = 'all' | 'ready' | 'shared' | 'month';

interface RecordingsExplorerProps {
    recordings: RecordingCardView[];
    loading?: boolean;
    onRefreshRecording?: (recording: RecordingCardView) => Promise<RecordingCardView | null>;
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
export function RecordingsExplorer({
    recordings,
    loading = false,
    onRefreshRecording,
}: RecordingsExplorerProps) {
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<RecordingFilter>('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [activeRecording, setActiveRecording] = useState<RecordingCardView | null>(null);
    const [refreshingRecordingId, setRefreshingRecordingId] = useState<string | null>(null);

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
        : loading
            ? 'Loading recordings from the secure backend...'
            : `${filteredRecordings.length.toLocaleString('en')} recording${filteredRecordings.length === 1 ? '' : 's'} found`;

    /**
     * Shares the recordings workspace URL instead of exposing provider assets.
     */
    async function handleShare(recording: RecordingCardView) {
        if (!recording.playbackUrl) {
            toast.info('Recording is still processing', {
                description: 'A shareable playback link will be available after processing completes.',
            });
            return;
        }

        try {
            const shareUrl = new URL('/recordings', window.location.origin);
            shareUrl.searchParams.set('recording', recording.id);
            await navigator.clipboard.writeText(shareUrl.toString());
            toast.success('Recording link copied');
        } catch {
            toast.error('Unable to copy recording link');
        }
    }

    /**
     * Asks the backend to pull finalized Stream playback metadata for this row.
     */
    async function handleRefreshPlayback(recording: RecordingCardView) {
        if (!onRefreshRecording) return;

        setRefreshingRecordingId(recording.id);

        try {
            const refreshedRecording = await onRefreshRecording(recording);
            if (refreshedRecording?.playbackUrl) {
                setActiveRecording(refreshedRecording);
                toast.success('Recording is ready to play');
                return;
            }

            toast.info('Recording is still processing', {
                description: 'Try again in a moment after Stream finishes preparing playback.',
            });
        } catch (err) {
            toast.error('Unable to refresh recording', {
                description: err instanceof Error ? err.message : 'Please try again.',
            });
        } finally {
            setRefreshingRecordingId(null);
        }
    }

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
                    loading={loading}
                    onPlay={setActiveRecording}
                    onShare={(recording) => void handleShare(recording)}
                />
            </div>

            {activeRecording && (
                <RecordingPlayerDialog
                    recording={activeRecording}
                    onClose={() => setActiveRecording(null)}
                    onRefreshPlayback={
                        onRefreshRecording
                            ? (recording) => void handleRefreshPlayback(recording)
                            : undefined
                    }
                    refreshing={refreshingRecordingId === activeRecording.id}
                    onShare={(recording) => void handleShare(recording)}
                />
            )}
        </div>
    );
}
