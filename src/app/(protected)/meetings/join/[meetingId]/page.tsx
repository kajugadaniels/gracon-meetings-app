/**
 * Protected live meeting room route.
 */
import type { Metadata } from 'next';
import { MeetingRoom } from '@/components/meetings/live/MeetingRoom';

export const metadata: Metadata = {
    title: 'Live Meeting',
    description: 'Secure Gracon 360 live meeting room.',
};

/**
 * Renders a Stream-backed meeting room for an authorized Gracon meeting.
 */
export default async function MeetingJoinPage({
    params,
}: {
    params: Promise<{ meetingId: string }>;
}) {
    const { meetingId } = await params;
    return <MeetingRoom meetingId={meetingId} />;
}
