/**
 * Login form for the meetings workspace.
 *
 * This intentionally mirrors the app/documents login form. Successful sign-in
 * performs a full navigation so the protected shell rehydrates against the
 * freshly written shared session cookies.
 */
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui';
import { APP_URL, MEETINGS_URL, normalizeMeetingsPath } from '@/lib/session';

interface LoginErrors {
    email?: string;
    password?: string;
}

interface LoginResponse {
    tokenType: 'full' | 'limited';
    data: {
        accessToken: string;
        refreshToken: string;
    };
}

async function login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        const message =
            (payload as { message?: string } | null)?.message ??
            'Login failed. Please check your credentials.';
        throw new Error(message);
    }

    return payload as LoginResponse;
}

/**
 * Renders the meetings workspace login form with documents-compatible styling.
 */
export function LoginForm() {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<LoginErrors>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const nextPath = normalizeMeetingsPath(searchParams.get('next'));

    function validate(): boolean {
        const nextErrors: LoginErrors = {};
        const normalizedEmail = email.toLowerCase().trim();

        if (!normalizedEmail) {
            nextErrors.email = 'Please enter a valid email address';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            nextErrors.email = 'Please enter a valid email address';
        }

        if (!password) {
            nextErrors.password = 'Password is required';
        } else if (password.length > 128) {
            nextErrors.password = 'Password is too long';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setApiError(null);

        if (!validate()) {
            return;
        }

        setLoading(true);

        try {
            const response = await login(email.toLowerCase().trim(), password);

            if (response.tokenType === 'limited') {
                const returnUrl = `${MEETINGS_URL}${nextPath}`;
                window.location.href = `${APP_URL}/verify-identity?next=${encodeURIComponent(returnUrl)}`;
                return;
            }

            window.location.href = nextPath;
        } catch (error: unknown) {
            setApiError(error instanceof Error
                ? error.message
                : 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card strength="strong" style={{ width: '100%', maxWidth: 400 }}>
            <div className="animate-fade-up" style={{ padding: '4px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#fff',
                            margin: '0 auto 18px',
                            boxShadow: '0 4px 16px var(--color-primary-glow)',
                        }}
                    >
                        ID
                    </div>

                    <h1
                        style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: 'var(--color-text-primary)',
                            marginBottom: 6,
                            letterSpacing: '-0.02em',
                        }}
                    >
                        Welcome back
                    </h1>
                    <p
                        style={{
                            fontSize: 14,
                            color: 'var(--color-text-secondary)',
                            margin: 0,
                        }}
                    >
                        Sign in to your verified account
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                    noValidate
                >
                    <Input
                        label="Email address"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => {
                            setEmail(event.target.value);
                            if (errors.email) {
                                setErrors((previous) => ({
                                    ...previous,
                                    email: undefined,
                                }));
                            }
                        }}
                        error={errors.email}
                    />

                    <Input
                        label="Password"
                        showPasswordToggle
                        placeholder="Your password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(event) => {
                            setPassword(event.target.value);
                            if (errors.password) {
                                setErrors((previous) => ({
                                    ...previous,
                                    password: undefined,
                                }));
                            }
                        }}
                        error={errors.password}
                    />

                    {apiError && (
                        <div
                            role="alert"
                            className="animate-scale-in"
                            style={{
                                background: 'var(--color-error-subtle)',
                                border: '1px solid var(--color-error-border)',
                                borderRadius: 'var(--radius-md)',
                                padding: '10px 14px',
                                fontSize: 13,
                                color: 'var(--color-error)',
                            }}
                        >
                            {apiError}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <a
                            href={`${APP_URL}/forgot-password`}
                            style={{
                                fontSize: 12,
                                color: 'var(--color-text-muted)',
                                textDecoration: 'none',
                                fontWeight: 500,
                            }}
                        >
                            Forgot password?
                        </a>
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        loading={loading}
                        loadingText="Signing in..."
                        style={{ marginTop: 4 }}
                    >
                        Sign in
                    </Button>
                </form>

                <p
                    style={{
                        textAlign: 'center',
                        fontSize: 13,
                        color: 'var(--color-text-muted)',
                        marginTop: 24,
                        marginBottom: 0,
                    }}
                >
                    Don&apos;t have an account?{' '}
                    <a
                        href={`${APP_URL}/register`}
                        style={{
                            color: 'var(--color-primary)',
                            fontWeight: 500,
                            textDecoration: 'none',
                        }}
                    >
                        Create one
                    </a>
                </p>
            </div>
        </Card>
    );
}
