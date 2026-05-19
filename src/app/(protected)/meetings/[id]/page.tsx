/**
 * In-meeting room page.
 */
import type { Metadata } from 'next';
import { MeetingRoom } from '@/components/meetings/MeetingRoom';
import { createMeetingRoomFallback } from '@/lib/meetings/meeting-view-models';

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
    const meeting = createMeetingRoomFallback(id, title);

    return <MeetingRoom meeting={meeting} />;
}
