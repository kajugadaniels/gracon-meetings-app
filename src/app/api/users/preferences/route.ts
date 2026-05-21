/**
 * Same-origin route for reading auth-owned user invitation preferences.
 *
 * The meetings frontend should not call api/auth directly from browser code.
 * This route resolves the shared Gracon session server-side and forwards only
 * the authenticated preference read to the identity service.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
    applySessionCookies,
    clearSessionCookies,
    resolveAccessToken,
} from '@/lib/server/session-proxy';

const AUTH_SERVICE_BASE =
    process.env.NEXT_PUBLIC_AUTH_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3000/api/v1';

/**
 * Reads the current user's default invitation verification preferences.
 */
export async function GET(request: NextRequest) {
    try {
        const { accessToken, refreshedTokens } = await resolveAccessToken(request);

        if (!accessToken) {
            return clearSessionCookies(
                NextResponse.json({ message: 'Authentication required.' }, { status: 401 }),
            );
        }

        const upstreamResponse = await fetch(`${AUTH_SERVICE_BASE}/users/preferences`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });
        const payload = await upstreamResponse.json().catch(() => null);
        const response = NextResponse.json(payload ?? {}, {
            status: upstreamResponse.status,
        });

        if (upstreamResponse.status === 401) {
            clearSessionCookies(response);
        } else if (refreshedTokens) {
            applySessionCookies(response, refreshedTokens);
        }

        return response;
    } catch {
        return NextResponse.json(
            { message: 'Unable to reach auth service.' },
            { status: 502 },
        );
    }
}
