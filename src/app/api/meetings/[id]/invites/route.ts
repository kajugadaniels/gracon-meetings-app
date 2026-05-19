/**
 * Same-origin meeting invitation creation route.
 */
import { NextRequest } from 'next/server';
import { proxyMeetingsApi } from '@/lib/server/meetings-api-proxy';

/**
 * Creates a meeting invitation through api/meetings using server-resolved auth.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
) {
    const { id } = await context.params;
    const body = await request.json().catch(() => null);

    return proxyMeetingsApi(request, {
        method: 'POST',
        path: `/meetings/${encodeURIComponent(id)}/invites`,
        body,
    });
}
