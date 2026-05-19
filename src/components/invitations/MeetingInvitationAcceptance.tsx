/**
 * Client-side meeting invitation acceptance flow.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    CalendarCheck2,
    CheckCircle2,
    KeyRound,
    LockKeyhole,
    MailCheck,
    ShieldCheck,
    UserRoundCheck,
} from 'lucide-react';
import { APP_URL, MEETINGS_URL, fetchCurrentUser, redirectToLogin } from '@/lib/session';
import { getMeeting } from '@/lib/meetings/api-client';
import styles from './meeting-invitation-acceptance.module.css';

type VerificationRequirement = 'EMAIL_OTP' | 'IDENTITY_VERIFICATION';
type WizardStepState = 'complete' | 'active' | 'locked';

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

interface WizardStep {
    label: string;
    state: WizardStepState;
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
 * Formats invitation expiration without exposing unnecessary backend metadata.
 */
function formatExpiry(expiresAt: string): string {
    return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(expiresAt));
}

/**
 * Produces compact wizard steps from backend-selected verification gates.
 */
function buildWizardSteps(
    status: InviteStatus,
    emailRequired: boolean,
    identityRequired: boolean,
    gatesComplete: boolean,
): WizardStep[] {
    const steps: WizardStep[] = [{ label: 'Account', state: 'complete' }];

    if (emailRequired) {
        steps.push({
            label: 'Email',
            state: status.emailVerified ? 'complete' : 'active',
        });
    }

    if (identityRequired) {
        const emailGateComplete = !emailRequired || Boolean(status.emailVerified);
        steps.push({
            label: 'Identity',
            state: status.identityVerified
                ? 'complete'
                : emailGateComplete ? 'active' : 'locked',
        });
    }

    steps.push({
        label: 'Accept',
        state: gatesComplete ? 'active' : 'locked',
    });

    return steps;
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

    const wizardSteps = useMemo(() => (
        status
            ? buildWizardSteps(status, emailRequired, identityRequired, gatesComplete)
            : []
    ), [emailRequired, gatesComplete, identityRequired, status]);
    const canWorkOnIdentity = !emailRequired || Boolean(status?.emailVerified);

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
                try {
                    const meeting = await getMeeting(accepted.meetingId);
                    router.push(meeting.status === 'SCHEDULED'
                        ? '/home'
                        : `/meetings/${accepted.meetingId}`);
                } catch {
                    // If the metadata refresh fails after a successful accept, keep the user
                    // in the safe meetings dashboard where the accepted room can load later.
                    router.push('/home');
                }
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
                <section className={styles.stateCard}>
                    <span className={styles.loadingMark} />
                    <p className={styles.stateTitle}>Loading invitation</p>
                    <p className={styles.stateCopy}>Checking the secure meeting link.</p>
                </section>
            </main>
        );
    }

    if (!status) {
        return (
            <main className={styles.shell}>
                <section className={styles.stateCard}>
                    <span className={styles.unavailableIcon}>
                        <LockKeyhole size={20} />
                    </span>
                    <h1>Invitation unavailable</h1>
                    <p>{error ?? 'This meeting invitation could not be loaded.'}</p>
                </section>
            </main>
        );
    }

    return (
        <main className={styles.shell}>
            <section className={styles.card}>
                <aside className={styles.summary}>
                    <span className={styles.brandMark}>
                        <LockKeyhole size={20} />
                    </span>
                    <p className={styles.eyebrow}>Secure invitation</p>
                    <h1>{status.meetingTitle}</h1>
                    <div className={styles.summaryMeta}>
                        <span>
                            <MailCheck size={14} />
                            {status.email}
                        </span>
                        <span>
                            <CalendarCheck2 size={14} />
                            Expires {formatExpiry(status.expiresAt)}
                        </span>
                    </div>
                    <div className={styles.securityGrid}>
                        <div>
                            <strong>{emailRequired ? 'Required' : 'Not required'}</strong>
                            <span>Email OTP</span>
                        </div>
                        <div>
                            <strong>{identityRequired ? 'Required' : 'Not required'}</strong>
                            <span>Identity check</span>
                        </div>
                    </div>
                </aside>

                <section className={styles.wizard} aria-labelledby="invite-wizard-title">
                    <div className={styles.wizardHeader}>
                        <div>
                            <p className={styles.eyebrow}>Acceptance wizard</p>
                            <h2 id="invite-wizard-title">Complete the secure handoff</h2>
                        </div>
                        <button type="button" className={styles.secondaryAction} onClick={handleLogin}>
                            Change account
                        </button>
                    </div>

                    <ol className={styles.progress} aria-label="Invitation acceptance progress">
                        {wizardSteps.map((step, index) => (
                            <li
                                key={`${step.label}-${index}`}
                                className={styles[`${step.state}Step`]}
                            >
                                <span>{step.state === 'complete' ? <CheckCircle2 size={15} /> : index + 1}</span>
                                {step.label}
                            </li>
                        ))}
                    </ol>

                    <div className={styles.stepPanel}>
                        <div className={styles.stepPanelHeader}>
                            <span className={styles.stepIcon}>
                                <UserRoundCheck size={20} />
                            </span>
                            <div>
                                <strong>Signed in as invited account</strong>
                                <p>{status.email}</p>
                            </div>
                        </div>
                    </div>

                    {emailRequired && (
                        <div className={status.emailVerified ? styles.completePanel : styles.stepPanel}>
                            <div className={styles.stepPanelHeader}>
                                <span className={styles.stepIcon}>
                                    <MailCheck size={20} />
                                </span>
                                <div>
                                    <strong>Email verification</strong>
                                    <p>{status.emailVerified ? 'Email confirmed.' : 'Enter the code sent to the invited email.'}</p>
                                </div>
                            </div>
                            {!status.emailVerified && (
                                <div className={styles.inlineForm}>
                                    <input
                                        value={emailCode}
                                        onChange={(event) => setEmailCode(event.target.value)}
                                        placeholder="6-digit code"
                                        inputMode="numeric"
                                        aria-label="Email verification code"
                                    />
                                    <button type="button" disabled={working} onClick={handleSendEmailCode}>
                                        Send
                                    </button>
                                    <button type="button" disabled={working || emailCode.trim().length < 4} onClick={handleVerifyEmailCode}>
                                        Verify
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {identityRequired && (
                        <div className={status.identityVerified ? styles.completePanel : styles.stepPanel}>
                            <div className={styles.stepPanelHeader}>
                                <span className={styles.stepIcon}>
                                    <ShieldCheck size={20} />
                                </span>
                                <div>
                                    <strong>Identity verification</strong>
                                    <p>{status.identityVerified ? 'Identity confirmed.' : 'Confirm your Gracon verified identity.'}</p>
                                </div>
                            </div>
                            {!status.identityVerified && (
                                <button
                                    type="button"
                                    className={styles.panelAction}
                                    disabled={working || !canWorkOnIdentity}
                                    onClick={handleCompleteIdentity}
                                >
                                    Verify identity
                                </button>
                            )}
                        </div>
                    )}

                    {!status.requiredVerifications.length && (
                        <div className={styles.completePanel}>
                            <div className={styles.stepPanelHeader}>
                                <span className={styles.stepIcon}>
                                    <KeyRound size={20} />
                                </span>
                                <div>
                                    <strong>No extra gate</strong>
                                    <p>This invite only needs the invited account session.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && <p className={styles.error}>{error}</p>}

                    <button
                        type="button"
                        className={styles.primaryAction}
                        disabled={working || !status.canAccept || !gatesComplete}
                        onClick={handleAccept}
                    >
                        <span>{working ? 'Processing...' : 'Accept invitation'}</span>
                        <ArrowRight size={16} />
                    </button>
                </section>
            </section>
        </main>
    );
}
