/**
 * Login form for the meetings workspace.
 *
 * This mirrors the app/documents development login behavior while production
 * can still delegate authentication to app/app through the proxy/session rules.
 */
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { APP_URL, MEETINGS_URL, normalizeMeetingsPath } from '@/lib/session';
import styles from './LoginForm.module.css';

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
 * Renders the meetings workspace login form.
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

        if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
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

        if (!validate()) return;

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
        <section className={styles.card} aria-label="Meetings sign in">
            <div className={styles.inner}>
                <div className={styles.header}>
                    <div className={styles.mark}>ID</div>
                    <h1 className={styles.title}>Welcome back</h1>
                    <p className={styles.copy}>
                        Sign in to your verified account
                    </p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    <label className={styles.field}>
                        <span className={styles.label}>Email address</span>
                        <input
                            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => {
                                setEmail(event.target.value);
                                if (errors.email) {
                                    setErrors((previous) => ({ ...previous, email: undefined }));
                                }
                            }}
                            required
                        />
                        {errors.email ? <span className={styles.errorText}>{errors.email}</span> : null}
                    </label>

                    <label className={styles.field}>
                        <span className={styles.label}>Password</span>
                        <input
                            className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                            type="password"
                            placeholder="Your password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => {
                                setPassword(event.target.value);
                                if (errors.password) {
                                    setErrors((previous) => ({ ...previous, password: undefined }));
                                }
                            }}
                            required
                        />
                        {errors.password ? <span className={styles.errorText}>{errors.password}</span> : null}
                    </label>

                    {apiError ? (
                        <div className={styles.apiError} role="alert">
                            {apiError}
                        </div>
                    ) : null}

                    <div className={styles.forgotRow}>
                        <a className={styles.textLink} href={`${APP_URL}/forgot-password`}>
                            Forgot password?
                        </a>
                    </div>

                    <button className={styles.button} type="submit" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <p className={styles.footer}>
                    Don&apos;t have an account? <a href={`${APP_URL}/register`}>Create one</a>
                </p>
            </div>
        </section>
    );
}
