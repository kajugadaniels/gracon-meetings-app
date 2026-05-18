/**
 * Public meeting invitation acceptance page.
 */
import type { Metadata } from 'next';
import { MeetingInvitationAcceptance } from '@/components/invitations/MeetingInvitationAcceptance';

interface MeetingInvitationPageProps {
    params: Promise<{
        token: string;
    }>;
}

export const metadata: Metadata = {
    title: 'Meeting Invitation | Gracon 360',
    description: 'Accept a secure Gracon 360 meeting invitation.',
};

/**
 * Renders the invitation acceptance flow for a token from email.
 */
export default async function MeetingInvitationPage({ params }: MeetingInvitationPageProps) {
    const { token } = await params;
    return <MeetingInvitationAcceptance token={token} />;
}
