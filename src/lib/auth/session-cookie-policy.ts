/**
 * Shared Gracon session cookie policy for app/meetings.
 *
 * Local development can use readable cookies to match the existing developer
 * flow. Production should use parent-domain HttpOnly cookies issued by app/app.
 */
const DEFAULT_ACCESS_TOKEN_COOKIE = 'g360_at';
const DEFAULT_REFRESH_TOKEN_COOKIE = 'g360_rt';
const DEFAULT_SESSION_HINT_COOKIE = 'session_active';
const DEFAULT_ACCESS_TOKEN_TTL = '15m';
const DEFAULT_REFRESH_TOKEN_TTL = '1d';

type CookieSameSite = 'strict' | 'lax' | 'none';

function getEnv(name: string): string | undefined {
    return process.env[name]?.trim() || undefined;
}

function normalizeSameSite(value: string | undefined): CookieSameSite {
    const normalized = value?.toLowerCase();
    if (normalized === 'strict') return 'strict';
    if (normalized === 'none') return 'none';
    return 'lax';
}

function parseDurationSeconds(value: string | undefined, fallback: string): number {
    const source = value ?? fallback;
    const match = /^(\d+)([smhd])$/.exec(source.trim().toLowerCase());

    if (!match) return parseDurationSeconds(fallback, '1d');

    const amount = Number(match[1]);
    const unit = match[2];

    if (unit === 's') return amount;
    if (unit === 'm') return amount * 60;
    if (unit === 'h') return amount * 60 * 60;
    return amount * 60 * 60 * 24;
}

export const meetingsAuthCookiePolicy = {
    accessCookieName:
        getEnv('AUTH_ACCESS_COOKIE_NAME') ??
        getEnv('NEXT_PUBLIC_AUTH_ACCESS_COOKIE_NAME') ??
        DEFAULT_ACCESS_TOKEN_COOKIE,
    refreshCookieName:
        getEnv('AUTH_REFRESH_COOKIE_NAME') ??
        getEnv('NEXT_PUBLIC_AUTH_REFRESH_COOKIE_NAME') ??
        DEFAULT_REFRESH_TOKEN_COOKIE,
    sessionHintCookieName:
        getEnv('AUTH_SESSION_HINT_COOKIE_NAME') ??
        getEnv('NEXT_PUBLIC_AUTH_SESSION_HINT_COOKIE_NAME') ??
        DEFAULT_SESSION_HINT_COOKIE,
    cookieDomain:
        getEnv('AUTH_COOKIE_DOMAIN') ?? getEnv('NEXT_PUBLIC_AUTH_COOKIE_DOMAIN'),
    cookieSecure:
        getEnv('AUTH_COOKIE_SECURE') === 'true' ||
        getEnv('NEXT_PUBLIC_AUTH_COOKIE_SECURE') === 'true' ||
        process.env.NODE_ENV === 'production',
    cookieSameSite: normalizeSameSite(
        getEnv('AUTH_COOKIE_SAME_SITE') ?? getEnv('NEXT_PUBLIC_AUTH_COOKIE_SAME_SITE'),
    ),
    accessTokenMaxAgeSeconds: parseDurationSeconds(
        getEnv('AUTH_ACCESS_TOKEN_TTL') ?? getEnv('NEXT_PUBLIC_AUTH_ACCESS_TOKEN_TTL'),
        DEFAULT_ACCESS_TOKEN_TTL,
    ),
    refreshTokenMaxAgeSeconds: parseDurationSeconds(
        getEnv('AUTH_REFRESH_TOKEN_TTL') ?? getEnv('NEXT_PUBLIC_AUTH_REFRESH_TOKEN_TTL'),
        DEFAULT_REFRESH_TOKEN_TTL,
    ),
};

/**
 * Returns true when app/meetings should hand login to the identity app.
 */
export function shouldUseMainAppLogin(): boolean {
    const explicit =
        getEnv('MEETINGS_USE_MAIN_APP_LOGIN') ??
        getEnv('NEXT_PUBLIC_MEETINGS_USE_MAIN_APP_LOGIN');

    if (explicit === 'true') return true;
    if (explicit === 'false') return false;

    return process.env.NODE_ENV === 'production';
}

/**
 * Returns true when local development may keep auth cookies JavaScript-readable.
 */
export function shouldAllowReadableMeetingsAuthCookies(): boolean {
    const explicit =
        getEnv('ALLOW_DEV_READABLE_AUTH_COOKIES') ??
        getEnv('NEXT_PUBLIC_ALLOW_DEV_READABLE_AUTH_COOKIES');

    if (explicit === 'true') return true;
    if (explicit === 'false') return false;

    return process.env.NODE_ENV !== 'production';
}
