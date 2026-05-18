/**
 * Initial protected meetings dashboard.
 */
import type { Metadata } from 'next';
import { MeetingsWorkspace } from '@/components/meetings/MeetingsWorkspace';

export const metadata: Metadata = {
    title: 'Meetings',
    description: 'Secure Gracon 360 meeting workspace.',
};

/**
 * Renders the first meetings workspace screen before live-call features land.
 */
export default function MeetingsPage() {
    return <MeetingsWorkspace />;
}
