/**
 * Same-origin Stream token route.
 */
import { NextRequest } from 'next/server';
import { proxyMeetingsApi } from '@/lib/server/meetings-api-proxy';

/**
 * Requests a short-lived Stream token from api/meetings.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    const { id } = await context.params;
    return proxyMeetingsApi(request, {
        method: 'POST',
        path: `/meetings/${encodeURIComponent(id)}/token`,
    });
}
