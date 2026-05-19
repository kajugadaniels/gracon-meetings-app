/**
 * Same-origin meeting detail route for app/meetings.
 */
import { NextRequest } from 'next/server';
import { proxyMeetingsApi } from '@/lib/server/meetings-api-proxy';

/**
 * Fetches one meeting through api/meetings after server-side session recovery.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    const { id } = await context.params;

    return proxyMeetingsApi(request, {
        method: 'GET',
        path: `/meetings/${encodeURIComponent(id)}`,
    });
}
