/**
 * Same-origin meeting invitation email-code send route.
 */
import { NextRequest } from 'next/server';
import { proxyMeetingsApi } from '@/lib/server/meetings-api-proxy';

/**
 * Requests an email OTP for the invitation.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ token: string }> },
) {
    const { token } = await context.params;
    return proxyMeetingsApi(request, {
        method: 'POST',
        path: `/invites/${encodeURIComponent(token)}/email-code/send`,
        auth: 'none',
    });
}
