/**
 * Local development login proxy for app/meetings.
 *
 * Production should usually authenticate in app/app, but this route keeps the
 * same developer workflow used by app/documents while still writing cookies
 * with the shared Gracon session policy.
 */
import { NextResponse } from 'next/server';
import {
    meetingsAuthCookiePolicy,
    shouldAllowReadableMeetingsAuthCookies,
} from '@/lib/auth/session-cookie-policy';

const AUTH_SERVICE_BASE =
    process.env.NEXT_PUBLIC_AUTH_API_URL ?? 'http://localhost:3000/api/v1';

/**
 * Proxies credential login to api/auth and writes shared auth cookies.
 */
export async function POST(request: Request) {
    try {
        const body = await request.text();
        const response = await fetch(`${AUTH_SERVICE_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            cache: 'no-store',
        });

        const responseText = await response.text();
        const nextResponse = new NextResponse(responseText, {
            status: response.status,
            headers: {
                'Content-Type':
                    response.headers.get('content-type') ?? 'application/json',
            },
        });

        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                const payload = data?.data ?? data;
                const accessToken = payload?.accessToken as string | undefined;
                const refreshToken = payload?.refreshToken as string | undefined;

                if (accessToken && refreshToken) {
                    const commonOptions = {
                        path: '/',
                        sameSite: meetingsAuthCookiePolicy.cookieSameSite,
                        secure: meetingsAuthCookiePolicy.cookieSecure,
                        domain: meetingsAuthCookiePolicy.cookieDomain,
                        httpOnly: !shouldAllowReadableMeetingsAuthCookies(),
                    };

                    nextResponse.cookies.set(meetingsAuthCookiePolicy.accessCookieName, accessToken, {
                        ...commonOptions,
                        maxAge: meetingsAuthCookiePolicy.accessTokenMaxAgeSeconds,
                    });
                    nextResponse.cookies.set(meetingsAuthCookiePolicy.refreshCookieName, refreshToken, {
                        ...commonOptions,
                        maxAge: meetingsAuthCookiePolicy.refreshTokenMaxAgeSeconds,
                    });
                    nextResponse.cookies.set(meetingsAuthCookiePolicy.sessionHintCookieName, '1', {
                        maxAge: meetingsAuthCookiePolicy.refreshTokenMaxAgeSeconds,
                        path: '/',
                        sameSite: meetingsAuthCookiePolicy.cookieSameSite,
                        secure: meetingsAuthCookiePolicy.cookieSecure,
                        domain: meetingsAuthCookiePolicy.cookieDomain,
                    });
                }
            } catch {
                // Pass through the upstream response when auth returns non-JSON.
            }
        }

        return nextResponse;
    } catch {
        return Response.json(
            { message: 'Unable to reach authentication service.' },
            { status: 502 },
        );
    }
}
