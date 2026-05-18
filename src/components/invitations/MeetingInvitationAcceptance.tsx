/**
 * Client-side meeting invitation acceptance flow.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, KeyRound, LockKeyhole, MailCheck, ShieldCheck } from 'lucide-react';
import { APP_URL, MEETINGS_URL, fetchCurrentUser, redirectToLogin } from '@/lib/session';
import styles from './meeting-invitation-acceptance.module.css';

type VerificationRequirement = 'EMAIL_OTP' | 'IDENTITY_VERIFICATION';

interface InviteStatus {
    meetingTitle: string;
    email: string;
    requiredVerifications: VerificationRequirement[];
    authRequired: boolean;
    canAccept: boolean;
    acceptedAt?: string | null;
    expiresAt: string;
    emailVerified?: boolean;
    identityVerified?: boolean;
    gatesComplete?: boolean;
    meetingId?: string;
}

interface MeetingInvitationAcceptanceProps {
    token: string;
}

/**
 * Extracts a safe message from API error payloads.
 */
function getErrorMessage(payload: unknown, fallback: string): string {
    const message = (payload as { message?: string; error?: string } | null)?.message
        ?? (payload as { message?: string; error?: string } | null)?.error;

    return typeof message === 'string' && message.trim() ? message : fallback;
}

/**
 * Calls one of the local invitation proxy routes.
 */
async function callInviteApi<T>(
    token: string,
    path: string,
    body?: unknown,
): Promise<T> {
    const response = await fetch(`/api/invites/${encodeURIComponent(token)}${path}`, {
        method: path === '/preview' ? 'GET' : 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
        cache: 'no-store',
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(getErrorMessage(payload, 'Unable to process this invitation.'));
    }

    return payload as T;
}

/**
 * Renders the secure invitation acceptance journey.
 */
export function MeetingInvitationAcceptance({ token }: MeetingInvitationAcceptanceProps) {
    const router = useRouter();
    const [status, setStatus] = useState<InviteStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);
    const [emailCode, setEmailCode] = useState('');
    const [error, setError] = useState<string | null>(null);

    const emailRequired = status?.requiredVerifications.includes('EMAIL_OTP') ?? false;
    const identityRequired = status?.requiredVerifications.includes('IDENTITY_VERIFICATION') ?? false;
    const gatesComplete = status?.gatesComplete
        ?? ((!emailRequired || Boolean(status?.emailVerified))
            && (!identityRequired || Boolean(status?.identityVerified)));

    const requirementCopy = useMemo(() => {
        if (!status?.requiredVerifications.length) return 'No extra verification after login';
        return status.requiredVerifications
            .map((requirement) => (
                requirement === 'EMAIL_OTP' ? 'Email verification' : 'Identity verification'
            ))
            .join(' + ');
    }, [status]);

    useEffect(() => {
        let active = true;

        async function loadInvite() {
            try {
                const [preview] = await Promise.all([
                    callInviteApi<InviteStatus>(token, '/preview'),
                    callInviteApi<InviteStatus>(token, '/open'),
                ]);

                if (active) setStatus(preview);

                const session = await fetchCurrentUser();
                if (!active) return;

                if (session.status === 'unauthenticated') {
                    redirectToLogin(`/invitations/${token}`);
                    return;
                }

                if (session.status === 'unavailable') {
                    setError(session.message);
                }
            } catch (loadError) {
                if (active) {
                    setError(loadError instanceof Error
                        ? loadError.message
                        : 'Unable to load this invitation.');
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        void loadInvite();
        return () => {
            active = false;
        };
    }, [token]);

    async function refreshStatus() {
        const nextStatus = await callInviteApi<InviteStatus>(token, '/preview');
        setStatus((currentStatus) => ({ ...currentStatus, ...nextStatus }));
    }

    async function handleLogin() {
        redirectToLogin(`/invitations/${token}`);
    }

    async function handleSendEmailCode() {
        setWorking(true);
        setError(null);

        try {
            const nextStatus = await callInviteApi<InviteStatus>(token, '/email-code/send');
            setStatus(nextStatus);
        } catch (sendError) {
            setError(sendError instanceof Error
                ? sendError.message
                : 'Unable to send verification code.');
        } finally {
            setWorking(false);
        }
    }

    async function handleVerifyEmailCode() {
        setWorking(true);
        setError(null);

        try {
            const nextStatus = await callInviteApi<InviteStatus>(token, '/email-code/verify', {
                code: emailCode,
            });
            setStatus(nextStatus);
        } catch (verifyError) {
            setError(verifyError instanceof Error
                ? verifyError.message
                : 'Unable to verify code.');
        } finally {
            setWorking(false);
        }
    }

    async function handleCompleteIdentity() {
        setWorking(true);
        setError(null);

        try {
            const session = await fetchCurrentUser();
            if (session.status !== 'authenticated') {
                const returnUrl = `${MEETINGS_URL}/invitations/${token}`;
                window.location.href = `${APP_URL}/verify-identity?next=${encodeURIComponent(returnUrl)}`;
                return;
            }

            const nextStatus = await callInviteApi<InviteStatus>(token, '/identity/complete');
            setStatus(nextStatus);
        } catch (identityError) {
            setError(identityError instanceof Error
                ? identityError.message
                : 'Unable to complete identity verification.');
        } finally {
            setWorking(false);
        }
    }

    async function handleAccept() {
        setWorking(true);
        setError(null);

        try {
            const accepted = await callInviteApi<InviteStatus>(token, '/accept');
            if (accepted.meetingId) {
                router.push(`/meetings/${accepted.meetingId}`);
                return;
            }

            await refreshStatus();
        } catch (acceptError) {
            const message = acceptError instanceof Error
                ? acceptError.message
                : 'Unable to accept this invitation.';

            if (message.toLowerCase().includes('auth') || message.toLowerCase().includes('login')) {
                redirectToLogin(`/invitations/${token}`);
                return;
            }

            setError(message);
        } finally {
            setWorking(false);
        }
    }

    if (loading) {
        return (
            <main className={styles.shell}>
                <section className={styles.card}>
                    <div className={styles.loadingMark} />
                    <p>Loading secure invitation...</p>
                </section>
            </main>
        );
    }

    if (!status) {
        return (
            <main className={styles.shell}>
                <section className={styles.card}>
                    <h1>Invitation unavailable</h1>
                    <p>{error ?? 'This meeting invitation could not be loaded.'}</p>
                </section>
            </main>
        );
    }

    return (
        <main className={styles.shell}>
            <section className={styles.card}>
                <div className={styles.header}>
                    <span className={styles.icon}>
                        <LockKeyhole size={20} />
                    </span>
                    <div>
                        <p className={styles.eyebrow}>Secure meeting invitation</p>
                        <h1>{status.meetingTitle}</h1>
                        <p>Invited account: {status.email}</p>
                    </div>
                </div>

                <div className={styles.requirementCard}>
                    <span>Required verification</span>
                    <strong>{requirementCopy}</strong>
                    <p>The host selected these gates before the meeting room can open.</p>
                </div>

                <div className={styles.steps}>
                    <article className={styles.stepComplete}>
                        <CheckCircle2 size={18} />
                        <div>
                            <strong>Sign in with invited account</strong>
                            <p>Login is always required before accepting a secure meeting invite.</p>
                        </div>
                        <button type="button" onClick={handleLogin}>Sign in</button>
                    </article>

                    {emailRequired && (
                        <article className={status.emailVerified ? styles.stepComplete : ''}>
                            <MailCheck size={18} />
                            <div>
                                <strong>Email verification</strong>
                                <p>Confirm the invited email with a one-time code.</p>
                                {!status.emailVerified && (
                                    <div className={styles.inlineForm}>
                                        <input
                                            value={emailCode}
                                            onChange={(event) => setEmailCode(event.target.value)}
                                            placeholder="6-digit code"
                                            inputMode="numeric"
                                        />
                                        <button
                                            type="button"
                                            disabled={working}
                                            onClick={handleVerifyEmailCode}
                                        >
                                            Verify
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button type="button" disabled={working || status.emailVerified} onClick={handleSendEmailCode}>
                                {status.emailVerified ? 'Verified' : 'Send code'}
                            </button>
                        </article>
                    )}

                    {identityRequired && (
                        <article className={status.identityVerified ? styles.stepComplete : ''}>
                            <ShieldCheck size={18} />
                            <div>
                                <strong>Identity verification</strong>
                                <p>Use your verified Gracon identity before joining this meeting.</p>
                            </div>
                            <button
                                type="button"
                                disabled={working || status.identityVerified}
                                onClick={handleCompleteIdentity}
                            >
                                {status.identityVerified ? 'Verified' : 'Verify identity'}
                            </button>
                        </article>
                    )}

                    {!status.requiredVerifications.length && (
                        <article className={styles.stepComplete}>
                            <KeyRound size={18} />
                            <div>
                                <strong>No extra verification</strong>
                                <p>After signing in with the invited account, you can accept this invite.</p>
                            </div>
                        </article>
                    )}
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <button
                    type="button"
                    className={styles.primaryAction}
                    disabled={working || !status.canAccept || !gatesComplete}
                    onClick={handleAccept}
                >
                    {working ? 'Processing...' : 'Accept and join meeting'}
                </button>
            </section>
        </main>
    );
}
