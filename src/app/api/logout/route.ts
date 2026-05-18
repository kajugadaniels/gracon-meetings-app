/**
 * Same-origin logout route for app/meetings.
 *
 * It revokes the current refresh token when available and clears shared cookies
 * before app/app completes its own logout cleanup.
 */
import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookies, getSessionCookies } from '@/lib/server/session-proxy';

const AUTH_BASE =
    process.env.NEXT_PUBLIC_AUTH_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3000/api/v1';

/**
 * Revokes and clears the current meetings session.
 */
export async function POST(request: NextRequest) {
    const { refreshToken } = getSessionCookies(request);

    if (refreshToken) {
        try {
            await fetch(`${AUTH_BASE}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
                cache: 'no-store',
            });
        } catch {
            // Always clear local cookies even when auth is already unavailable.
        }
    }

    return clearSessionCookies(NextResponse.json({ success: true }));
}
