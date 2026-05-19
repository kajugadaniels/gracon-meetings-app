/**
 * Previous meetings page.
 */
import type { Metadata } from 'next';
import { PreviousMeetingsDashboard } from '@/components/meetings/PreviousMeetingsDashboard';

export const metadata: Metadata = {
    title: 'Previous',
    description: 'Completed Gracon meetings.',
};

/**
 * Renders the backend-backed previous meetings dashboard.
 */
export default function PreviousPage() {
    return <PreviousMeetingsDashboard />;
}
