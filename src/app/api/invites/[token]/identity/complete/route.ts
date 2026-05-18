/**
 * Same-origin authenticated meeting invitation identity gate route.
 */
import { NextRequest } from 'next/server';
import { proxyMeetingsApi } from '@/lib/server/meetings-api-proxy';

/**
 * Marks the invitation identity gate complete after session validation.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ token: string }> },
) {
    const { token } = await context.params;
    return proxyMeetingsApi(request, {
        method: 'POST',
        path: `/invites/${encodeURIComponent(token)}/identity/complete`,
    });
}
