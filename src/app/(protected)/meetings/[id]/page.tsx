/**
 * Static in-meeting room page.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MeetingRoom } from '@/components/meetings/MeetingRoom';
import {
    createMeetingRoomFallback,
    getDefaultMeetingRoom,
    getMeetingRoomById,
} from '@/lib/meetings/static-meetings';

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
    description: 'Static Gracon meeting room interface.',
};

/**
 * Renders a static Zoom-style meeting interface for one seeded meeting.
 */
export default async function MeetingRoomPage({
    params,
    searchParams,
}: MeetingRoomPageProps) {
    const { id } = await params;
    const { title } = await searchParams;
    const meeting = getMeetingRoomById(id)
        ?? (title ? createMeetingRoomFallback(id, title) : getDefaultMeetingRoom());

    if (!meeting) notFound();

    return <MeetingRoom meeting={meeting} />;
}
