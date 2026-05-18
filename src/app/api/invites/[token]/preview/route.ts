/**
 * Same-origin public meeting invitation preview route.
 */
import { NextRequest } from 'next/server';
import { proxyMeetingsApi } from '@/lib/server/meetings-api-proxy';

/**
 * Returns public-safe invitation metadata without requiring login.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ token: string }> },
) {
    const { token } = await context.params;
    return proxyMeetingsApi(request, {
        method: 'GET',
        path: `/invites/${encodeURIComponent(token)}/preview`,
        auth: 'none',
    });
}
