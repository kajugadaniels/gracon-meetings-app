/**
 * Meeting recordings page.
 */
import type { Metadata } from 'next';
import { RecordingsDashboard } from '@/components/meetings/RecordingsDashboard';

export const metadata: Metadata = {
    title: 'Recordings',
    description: 'Recorded Gracon meetings.',
};

/**
 * Renders the backend-backed recordings library.
 */
export default function RecordingsPage() {
    return <RecordingsDashboard />;
}
