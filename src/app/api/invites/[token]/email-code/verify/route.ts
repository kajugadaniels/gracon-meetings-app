/**
 * Same-origin meeting invitation email-code verification route.
 */
import { NextRequest } from 'next/server';
import { proxyMeetingsApi } from '@/lib/server/meetings-api-proxy';

/**
 * Verifies the invite email OTP without exposing api/meetings directly.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ token: string }> },
) {
    const { token } = await context.params;
    return proxyMeetingsApi(request, {
        method: 'POST',
        path: `/invites/${encodeURIComponent(token)}/email-code/verify`,
        body: await request.json(),
        auth: 'none',
    });
}
