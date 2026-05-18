/**
 * Same-origin meeting recording start route.
 */
import { NextRequest } from 'next/server';
import { proxyMeetingsApi } from '@/lib/server/meetings-api-proxy';

/**
 * Starts recording through api/meetings without exposing bearer tokens to the browser.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    const { id } = await context.params;
    return proxyMeetingsApi(request, {
        method: 'POST',
        path: `/meetings/${encodeURIComponent(id)}/recordings/start`,
    });
}
