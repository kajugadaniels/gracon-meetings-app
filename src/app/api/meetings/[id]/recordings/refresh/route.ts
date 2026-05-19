/**
 * Same-origin meeting recording playback refresh route.
 */
import { NextRequest } from 'next/server';
import { proxyMeetingsApi } from '@/lib/server/meetings-api-proxy';

/**
 * Refreshes recording playback metadata through api/meetings without exposing
 * provider credentials or bearer tokens to the browser.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    const { id } = await context.params;
    return proxyMeetingsApi(request, {
        method: 'POST',
        path: `/meetings/${encodeURIComponent(id)}/recordings/refresh`,
    });
}
