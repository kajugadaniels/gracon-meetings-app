/**
 * Same-origin meeting recordings list route.
 */
import { NextRequest } from 'next/server';
import { proxyMeetingsApi } from '@/lib/server/meetings-api-proxy';

/**
 * Lists recording metadata through api/meetings after server-side session resolution.
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    const { id } = await context.params;
    return proxyMeetingsApi(request, {
        method: 'GET',
        path: `/meetings/${encodeURIComponent(id)}/recordings`,
    });
}
