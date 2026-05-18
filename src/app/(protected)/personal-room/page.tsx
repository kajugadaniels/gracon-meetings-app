/**
 * Personal room page.
 */
import type { Metadata } from 'next';
import { MeetingsPlaceholderPage } from '@/components/meetings/MeetingsPlaceholderPage';

export const metadata: Metadata = {
    title: 'Personal Room',
    description: 'Reusable Gracon personal meeting room.',
};

/**
 * Renders the personal room section placeholder.
 */
export default function PersonalRoomPage() {
    return (
        <MeetingsPlaceholderPage
            eyebrow="Personal room"
            title="Your reusable room will be managed here."
            copy="This room will give verified users a stable meeting link, room settings, waiting-room controls, and personal invite options."
        />
    );
}
