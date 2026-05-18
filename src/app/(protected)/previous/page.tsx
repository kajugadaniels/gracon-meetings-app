/**
 * Previous meetings page.
 */
import type { Metadata } from 'next';
import { MeetingsPlaceholderPage } from '@/components/meetings/MeetingsPlaceholderPage';

export const metadata: Metadata = {
    title: 'Previous',
    description: 'Completed Gracon meetings.',
};

/**
 * Renders the previous meetings section placeholder.
 */
export default function PreviousPage() {
    return (
        <MeetingsPlaceholderPage
            eyebrow="History"
            title="Previous meetings will be organized here."
            copy="This view will show ended meetings, participant history, audit status, and follow-up materials."
        />
    );
}
