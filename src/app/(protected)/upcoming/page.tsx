/**
 * Upcoming meetings page.
 */
import type { Metadata } from 'next';
import { MeetingsPlaceholderPage } from '@/components/meetings/MeetingsPlaceholderPage';

export const metadata: Metadata = {
    title: 'Upcoming',
    description: 'Scheduled Gracon meetings.',
};

/**
 * Renders the upcoming meetings section placeholder.
 */
export default function UpcomingPage() {
    return (
        <MeetingsPlaceholderPage
            eyebrow="Schedule"
            title="Upcoming meetings will live here."
            copy="This section will focus on scheduled meetings, reminders, invite status, and one-click start controls."
        />
    );
}
