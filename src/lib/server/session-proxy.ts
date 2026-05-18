/**
 * Server-side session helpers for app/meetings route handlers.
 *
 * These helpers validate and rotate shared auth cookies without exposing
 * refresh-token handling to browser components.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
    meetingsAuthCookiePolicy,
    shouldAllowReadableMeetingsAuthCookies,
} from '@/lib/auth/session-cookie-policy';

const AUTH_BASE =
    process.env.NEXT_PUBLIC_AUTH_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3000/api/v1';

export type RefreshedTokens = {
    accessToken: string;
    refreshToken: string;
    tokenType: 'full' | 'limited';
};

type RefreshMode = 'refresh' | 'upgrade';

function getRefreshPath(mode: RefreshMode) {
    return mode === 'upgrade' ? '/auth/session/upgrade' : '/auth/refresh';
}

/**
 * Reads auth cookies from a meetings route request.
 */
export function getSessionCookies(request: NextRequest) {
    return {
        accessToken:
            request.cookies.get(meetingsAuthCookiePolicy.accessCookieName)?.value ?? null,
        refreshToken:
            request.cookies.get(meetingsAuthCookiePolicy.refreshCookieName)?.value ?? null,
    };
}

/**
 * Rotates or upgrades a refresh token through api/auth.
 */
export async function refreshSession(
    refreshToken: string,
    mode: RefreshMode = 'refresh',
): Promise<RefreshedTokens | null> {
    const response = await fetch(`${AUTH_BASE}${getRefreshPath(mode)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
    });

    if (!response.ok) return null;

    const data = await response.json();
    const payload = data?.data ?? data;

    if (!payload?.accessToken || !payload?.refreshToken) return null;

    return {
        accessToken: payload.accessToken as string,
        refreshToken: payload.refreshToken as string,
        tokenType: payload.tokenType === 'limited' ? 'limited' : 'full',
    };
}

/**
 * Clears shared auth cookies for the meetings app response.
 */
export function clearSessionCookies<T extends NextResponse>(response: T): T {
    const options = {
        maxAge: 0,
        path: '/',
        sameSite: meetingsAuthCookiePolicy.cookieSameSite,
        secure: meetingsAuthCookiePolicy.cookieSecure,
        domain: meetingsAuthCookiePolicy.cookieDomain,
    };

    response.cookies.set(meetingsAuthCookiePolicy.accessCookieName, '', options);
    response.cookies.set(meetingsAuthCookiePolicy.refreshCookieName, '', options);
    response.cookies.set(meetingsAuthCookiePolicy.sessionHintCookieName, '', options);
    return response;
}

/**
 * Applies rotated auth cookies to the meetings app response.
 */
export function applySessionCookies<T extends NextResponse>(
    response: T,
    tokens: RefreshedTokens,
): T {
    const commonOptions = {
        path: '/',
        sameSite: meetingsAuthCookiePolicy.cookieSameSite,
        secure: meetingsAuthCookiePolicy.cookieSecure,
        domain: meetingsAuthCookiePolicy.cookieDomain,
        httpOnly: !shouldAllowReadableMeetingsAuthCookies(),
    };

    response.cookies.set(meetingsAuthCookiePolicy.accessCookieName, tokens.accessToken, {
        ...commonOptions,
        maxAge: meetingsAuthCookiePolicy.accessTokenMaxAgeSeconds,
    });
    response.cookies.set(meetingsAuthCookiePolicy.refreshCookieName, tokens.refreshToken, {
        ...commonOptions,
        maxAge: meetingsAuthCookiePolicy.refreshTokenMaxAgeSeconds,
    });
    response.cookies.set(meetingsAuthCookiePolicy.sessionHintCookieName, '1', {
        maxAge: meetingsAuthCookiePolicy.refreshTokenMaxAgeSeconds,
        path: '/',
        sameSite: meetingsAuthCookiePolicy.cookieSameSite,
        secure: meetingsAuthCookiePolicy.cookieSecure,
        domain: meetingsAuthCookiePolicy.cookieDomain,
    });

    return response;
}

/**
 * Resolves an access token, refreshing from cookies when possible.
 */
export async function resolveAccessToken(
    request: NextRequest,
    mode: RefreshMode = 'refresh',
): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
    refreshedTokens: RefreshedTokens | null;
}> {
    const { accessToken, refreshToken } = getSessionCookies(request);

    if (accessToken || !refreshToken) {
        return { accessToken, refreshToken, refreshedTokens: null };
    }

    const refreshedTokens = await refreshSession(refreshToken, mode);

    return {
        accessToken: refreshedTokens?.accessToken ?? null,
        refreshToken,
        refreshedTokens,
    };
}
