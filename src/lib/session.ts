/**
 * Client-side session helpers for app/meetings.
 *
 * The app keeps local development login available while production can hand
 * users to app/app for shared parent-domain authentication.
 */
import {
    meetingsAuthCookiePolicy,
    shouldUseMainAppLogin,
} from '@/lib/auth/session-cookie-policy';

export const APP_URL =
    process.env.NEXT_PUBLIC_MAIN_APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:4000';
export const MEETINGS_URL =
    process.env.NEXT_PUBLIC_MEETINGS_URL ?? 'http://localhost:4003';

const DEFAULT_NEXT_PATH = '/home';

export type SessionBootstrapResult =
    | { status: 'authenticated'; user: Record<string, unknown> }
    | { status: 'unauthenticated' }
    | { status: 'unavailable'; message: string };

/**
 * Normalizes a return path so login cannot redirect outside app/meetings.
 */
export function normalizeMeetingsPath(path: string | null | undefined): string {
    if (!path) return DEFAULT_NEXT_PATH;
    if (path.startsWith('/') && !path.startsWith('//')) return path;

    try {
        const meetingsOrigin = new URL(MEETINGS_URL).origin;
        const url = new URL(path);

        if (url.origin === meetingsOrigin) {
            return `${url.pathname}${url.search}${url.hash}`;
        }
    } catch {
        return DEFAULT_NEXT_PATH;
    }

    return DEFAULT_NEXT_PATH;
}

/**
 * Redirects unauthenticated users to the correct meetings login surface.
 */
export function redirectToLogin(intendedPath = DEFAULT_NEXT_PATH): void {
    if (typeof window === 'undefined') return;

    const next = normalizeMeetingsPath(intendedPath);
    if (shouldUseMainAppLogin()) {
        const loginUrl = new URL('/login', APP_URL);
        loginUrl.searchParams.set('next', new URL(next, MEETINGS_URL).toString());
        window.location.href = loginUrl.toString();
        return;
    }

    window.location.href = `/login?next=${encodeURIComponent(next)}`;
}

/**
 * Reads the access token from development-readable auth cookies.
 */
export function getAccessToken(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(
        new RegExp(`(?:^|;\\s*)${meetingsAuthCookiePolicy.accessCookieName}=([^;]+)`),
    );
    return match?.[1] ?? null;
}

function getUnavailableMessage(payload: unknown, fallback: string): string {
    const message = (payload as { message?: string; error?: string } | null)?.message
        ?? (payload as { message?: string; error?: string } | null)?.error;

    return typeof message === 'string' && message.trim() ? message : fallback;
}

/**
 * Fetches the current user from the local server-side session route.
 */
export async function fetchCurrentUser(): Promise<SessionBootstrapResult> {
    try {
        const response = await fetch('/api/session', {
            credentials: 'include',
            cache: 'no-store',
        });

        if (response.ok) {
            const data = await response.json();
            return {
                status: 'authenticated',
                user: (data?.user ?? data?.data ?? data) as Record<string, unknown>,
            };
        }

        if (response.status === 401) return { status: 'unauthenticated' };

        const payload = await response.json().catch(() => null);
        return {
            status: 'unavailable',
            message: getUnavailableMessage(payload, 'Unable to validate your session.'),
        };
    } catch {
        return {
            status: 'unavailable',
            message: 'Unable to reach the authentication service right now.',
        };
    }
}

/**
 * Logs out through app/meetings, then hands off to app/app to clear shared state.
 */
export async function logoutFromMeetings(): Promise<void> {
    try {
        await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include',
            cache: 'no-store',
        });
    } catch {
        // Handoff must continue so the identity app can clear its own state.
    }

    window.location.href = `${APP_URL}/logout`;
}
