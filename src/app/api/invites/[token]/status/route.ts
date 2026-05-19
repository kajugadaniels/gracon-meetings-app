/**
 * Same-origin authenticated meeting invitation gate-status route.
 */
import { NextRequest } from 'next/server';
import { proxyMeetingsApi } from '@/lib/server/meetings-api-proxy';

/**
 * Returns backend-authoritative gate status for the signed-in invited account.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ token: string }> },
) {
    const { token } = await context.params;
    return proxyMeetingsApi(request, {
        method: 'GET',
        path: `/invites/${encodeURIComponent(token)}/status`,
    });
}
