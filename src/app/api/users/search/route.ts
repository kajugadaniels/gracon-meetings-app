/**
 * Same-origin verified user search route for meeting invitations.
 */
import { NextRequest } from 'next/server';
import { proxyMeetingsApi } from '@/lib/server/meetings-api-proxy';

/**
 * Searches meeting-invite candidates through api/meetings while keeping auth
 * token resolution on the server.
 */
export async function GET(request: NextRequest) {
    const { search } = new URL(request.url);

    return proxyMeetingsApi(request, {
        method: 'GET',
        path: '/users/search',
        search,
    });
}
