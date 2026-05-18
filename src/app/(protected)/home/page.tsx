/**
 * Meetings home page.
 */
import type { Metadata } from 'next';
import { MeetingsWorkspace } from '@/components/meetings/MeetingsWorkspace';

export const metadata: Metadata = {
    title: 'Home',
    description: 'Create, start, and join secure Gracon meetings.',
};

/**
 * Renders the primary authenticated meetings workspace.
 */
export default function HomePage() {
    return <MeetingsWorkspace />;
}
