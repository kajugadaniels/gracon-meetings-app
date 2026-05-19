/**
 * Upcoming meetings page.
 */
import type { Metadata } from 'next';
import { UpcomingMeetingsDashboard } from '@/components/meetings/UpcomingMeetingsDashboard';

export const metadata: Metadata = {
    title: 'Upcoming',
    description: 'Scheduled Gracon meetings.',
};

/**
 * Renders the backend-backed upcoming meetings dashboard.
 */
export default function UpcomingPage() {
    return <UpcomingMeetingsDashboard />;
}
