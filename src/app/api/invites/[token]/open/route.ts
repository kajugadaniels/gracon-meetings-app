/**
 * Same-origin public meeting invitation open-audit route.
 */
import { NextRequest } from 'next/server';
import { proxyMeetingsApi } from '@/lib/server/meetings-api-proxy';

/**
 * Records that the invitation link was opened.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ token: string }> },
) {
    const { token } = await context.params;
    return proxyMeetingsApi(request, {
        method: 'POST',
        path: `/invites/${encodeURIComponent(token)}/open`,
        auth: 'none',
    });
}
