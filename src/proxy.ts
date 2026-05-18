/**
 * Route proxy for app/meetings authentication.
 *
 * This mirrors the documents app behavior: local login in development,
 * app/app login in production, and protected meeting pages by default.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
    meetingsAuthCookiePolicy,
    shouldUseMainAppLogin,
} from '@/lib/auth/session-cookie-policy';

const APP_URL =
    process.env.NEXT_PUBLIC_MAIN_APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:4000';

const PUBLIC_PATHS = ['/login'];

/**
 * Redirects unauthenticated users to the correct meetings login route.
 */
export function proxy(req: NextRequest) {
    const { pathname, search } = req.nextUrl;

    if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
        return NextResponse.next();
    }

    if (pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    const isPublic = PUBLIC_PATHS.some((path) => (
        pathname === path || pathname.startsWith(`${path}/`)
    ));
    const hasAuthCookie =
        req.cookies.has(meetingsAuthCookiePolicy.accessCookieName) ||
        req.cookies.has(meetingsAuthCookiePolicy.refreshCookieName);

    if (isPublic) return NextResponse.next();

    if (!hasAuthCookie) {
        const loginBase = shouldUseMainAppLogin() ? APP_URL : req.url;
        const loginUrl = new URL('/login', loginBase);
        const next = shouldUseMainAppLogin()
            ? new URL(`${pathname}${search}`, req.url).toString()
            : `${pathname}${search}`;

        loginUrl.searchParams.set('next', next);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)'],
};
