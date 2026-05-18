/**
 * Same-origin meetings collection route for app/meetings.
 */
import { NextRequest } from 'next/server';
import { proxyMeetingsApi } from '@/lib/server/meetings-api-proxy';

/**
 * Lists meetings through api/meetings using the server-resolved session.
 */
export async function GET(request: NextRequest) {
    return proxyMeetingsApi(request, {
        method: 'GET',
        path: '/meetings',
        search: request.nextUrl.search,
    });
}

/**
 * Creates a meeting through api/meetings without exposing bearer tokens.
 */
export async function POST(request: NextRequest) {
    return proxyMeetingsApi(request, {
        method: 'POST',
        path: '/meetings',
        body: await request.json(),
    });
}
