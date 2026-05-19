/**
 * Backward-compatible meetings route.
 */
import type { Metadata } from 'next';
import { MeetingsWorkspace } from '@/components/meetings/MeetingsWorkspace';

export const metadata: Metadata = {
    title: 'Home',
    description: 'Create, start, and join secure Gracon meetings.',
};

/**
 * Renders the home workspace directly so older `/meetings` links do not rely
 * on a runtime redirect that can break browser performance measurement in dev.
 */
export default function MeetingsPage() {
    return <MeetingsWorkspace />;
}
