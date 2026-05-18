/**
 * Same-origin meeting start route.
 */
import { NextRequest } from 'next/server';
import { proxyMeetingsApi } from '@/lib/server/meetings-api-proxy';

/**
 * Starts a meeting through api/meetings after server-side session resolution.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    const { id } = await context.params;
    return proxyMeetingsApi(request, {
        method: 'POST',
        path: `/meetings/${encodeURIComponent(id)}/start`,
    });
}
