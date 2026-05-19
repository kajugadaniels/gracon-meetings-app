/**
 * In-meeting room page.
 */
import type { Metadata } from 'next';
import { MeetingRoom } from '@/components/meetings/MeetingRoom';

interface MeetingRoomPageProps {
    params: Promise<{
        id: string;
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
}: MeetingRoomPageProps) {
    const { id } = await params;

    return <MeetingRoom meetingId={id} />;
}
