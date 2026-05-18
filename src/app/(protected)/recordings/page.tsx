/**
 * Meeting recordings page.
 */
import type { Metadata } from 'next';
import { MeetingsPlaceholderPage } from '@/components/meetings/MeetingsPlaceholderPage';

export const metadata: Metadata = {
    title: 'Recordings',
    description: 'Recorded Gracon meetings.',
};

/**
 * Renders the recordings section placeholder.
 */
export default function RecordingsPage() {
    return (
        <MeetingsPlaceholderPage
            eyebrow="Recordings"
            title="Recorded meetings will be stored here."
            copy="This area will expose approved recordings, processing states, retention controls, and playback access."
        />
    );
}
