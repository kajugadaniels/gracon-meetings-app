/**
 * Static in-meeting room page.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StaticMeetingRoom } from '@/components/meetings/StaticMeetingRoom';
import { getMeetingRoomById } from '@/lib/meetings/static-meetings';

interface MeetingRoomPageProps {
    params: Promise<{
        id: string;
    }>;
}

export const metadata: Metadata = {
    title: 'Meeting Room',
    description: 'Static Gracon meeting room interface.',
};

/**
 * Renders a static Zoom-style meeting interface for one seeded meeting.
 */
export default async function MeetingRoomPage({ params }: MeetingRoomPageProps) {
    const { id } = await params;
    const meeting = getMeetingRoomById(id);

    if (!meeting) notFound();

    return <StaticMeetingRoom meeting={meeting} />;
}
