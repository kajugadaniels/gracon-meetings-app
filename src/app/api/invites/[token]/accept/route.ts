/**
 * Same-origin authenticated meeting invitation acceptance route.
 */
import { NextRequest } from 'next/server';
import { proxyMeetingsApi } from '@/lib/server/meetings-api-proxy';

/**
 * Accepts an invitation only after api/meetings verifies every required gate.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ token: string }> },
) {
    const { token } = await context.params;
    return proxyMeetingsApi(request, {
        method: 'POST',
        path: `/invites/${encodeURIComponent(token)}/accept`,
    });
}
