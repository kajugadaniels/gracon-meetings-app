/**
 * In-meeting room page.
 */
import type { Metadata } from 'next';
import { MeetingRoom } from '@/components/meetings/MeetingRoom';

interface MeetingRoomPageProps {
    params: Promise<{
        id: string;
    }>;
    searchParams: Promise<{
        title?: string;
    }>;
}

export const metadata: Metadata = {
    title: 'Meeting Room',
    description: 'Gracon meeting room interface.',
};

/**
 * Renders the Gracon meeting room interface with a safe local fallback.
 */
export default async function MeetingRoomPage({
    params,
    searchParams,
}: MeetingRoomPageProps) {
    const { id } = await params;
    const { title } = await searchParams;

    return <MeetingRoom meetingId={id} initialTitle={title} />;
}
