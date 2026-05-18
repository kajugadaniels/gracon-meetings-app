/**
 * Server-side proxy from app/meetings route handlers to api/meetings.
 *
 * The browser only talks to same-origin routes. These helpers attach the
 * server-resolved Gracon access token so production HttpOnly cookies continue
 * to work across apps without exposing bearer-token handling to components.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
    applySessionCookies,
    clearSessionCookies,
    resolveAccessToken,
} from '@/lib/server/session-proxy';

const MEETINGS_API_BASE =
    process.env.NEXT_PUBLIC_MEETINGS_API_URL ?? 'http://localhost:3007/api/v1';

type ProxyMethod = 'GET' | 'POST' | 'PATCH';

interface ProxyOptions {
    method: ProxyMethod;
    path: string;
    body?: unknown;
    search?: string;
}

/**
 * Forwards an authenticated request to api/meetings and mirrors safe JSON back.
 */
export async function proxyMeetingsApi(
    request: NextRequest,
    options: ProxyOptions,
): Promise<NextResponse> {
    const { accessToken, refreshedTokens } = await resolveAccessToken(request);

    if (!accessToken) {
        return clearSessionCookies(
            NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
        );
    }

    const upstreamUrl = new URL(`${MEETINGS_API_BASE}${options.path}`);
    if (options.search) upstreamUrl.search = options.search;

    let response: Response;

    try {
        response = await fetch(upstreamUrl, {
            method: options.method,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
            cache: 'no-store',
        });
    } catch {
        const unavailableResponse = NextResponse.json(
            {
                error: 'Meetings service unavailable',
                message:
                    'The meetings backend is not reachable. Start api/meetings on port 3007 and try again.',
            },
            { status: 503 },
        );

        if (refreshedTokens) {
            applySessionCookies(unavailableResponse, refreshedTokens);
        }

        return unavailableResponse;
    }

    const payload = await response.json().catch(() => null);
    const nextResponse = NextResponse.json(payload ?? {}, {
        status: response.status,
    });

    if (refreshedTokens) {
        applySessionCookies(nextResponse, refreshedTokens);
    }

    return nextResponse;
}
