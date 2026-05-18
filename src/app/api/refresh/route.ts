/**
 * Same-origin session refresh route for app/meetings.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
    applySessionCookies,
    clearSessionCookies,
    getSessionCookies,
    refreshSession,
} from '@/lib/server/session-proxy';

/**
 * Refreshes the shared Gracon session using the refresh cookie.
 */
export async function POST(request: NextRequest) {
    const { refreshToken } = getSessionCookies(request);

    if (!refreshToken) {
        return clearSessionCookies(
            NextResponse.json({ error: 'No refresh token' }, { status: 401 }),
        );
    }

    try {
        const tokens = await refreshSession(refreshToken);

        if (!tokens) {
            return clearSessionCookies(
                NextResponse.json({ error: 'Refresh failed' }, { status: 401 }),
            );
        }

        return applySessionCookies(
            NextResponse.json({
                accessToken: tokens.accessToken,
                tokenType: tokens.tokenType,
            }),
            tokens,
        );
    } catch {
        return NextResponse.json(
            { error: 'Auth service unavailable' },
            { status: 503 },
        );
    }
}
