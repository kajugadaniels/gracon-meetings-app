/**
 * Client-side meeting invitation acceptance flow.
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    CalendarCheck2,
    CheckCircle2,
    KeyRound,
    LockKeyhole,
    MailCheck,
    ShieldCheck,
    Video,
    UserRoundCheck,
} from 'lucide-react';
import { APP_URL, MEETINGS_URL, fetchCurrentUser, redirectToLogin } from '@/lib/session';
import { getMeeting } from '@/lib/meetings/api-client';
import styles from './meeting-invitation-acceptance.module.css';

type VerificationRequirement = 'EMAIL_OTP' | 'IDENTITY_VERIFICATION';
type WizardStepState = 'complete' | 'active' | 'locked';
type InvitationStage = 'account' | 'email' | 'identity' | 'accept';
type StepMessageTone = 'success' | 'error' | 'info';

const OTP_LENGTH = 6;

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
        method: path === '/preview' || path === '/status' ? 'GET' : 'POST',
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
    stage: InvitationStage,
): WizardStep[] {
    const steps: WizardStep[] = [{
        label: 'Account',
        state: stage === 'account' ? 'active' : 'complete',
    }];

    if (emailRequired) {
        steps.push({
            label: 'Email',
            state: status.emailVerified
                ? 'complete'
                : stage === 'email' ? 'active' : 'locked',
        });
    }

    if (identityRequired) {
        steps.push({
            label: 'Identity',
            state: status.identityVerified
                ? 'complete'
                : stage === 'identity' ? 'active' : 'locked',
        });
    }

    steps.push({
        label: 'Accept',
        state: gatesComplete && stage === 'accept' ? 'active' : 'locked',
    });

    return steps;
}

/**
 * Returns the first actionable stage after the account check.
 */
function getNextStageAfterAccount(
    status: InviteStatus,
    emailRequired: boolean,
    identityRequired: boolean,
): InvitationStage {
    if (emailRequired && !status.emailVerified) return 'email';
    if (identityRequired && !status.identityVerified) return 'identity';
    return 'accept';
}

/**
 * Splits pasted or typed OTP text into individual numeric digits.
 */
function getOtpDigits(value: string): string[] {
    return value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
}

/**
 * Renders the secure invitation acceptance journey.
 */
export function MeetingInvitationAcceptance({ token }: MeetingInvitationAcceptanceProps) {
    const router = useRouter();
    const [status, setStatus] = useState<InviteStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);
    const [stage, setStage] = useState<InvitationStage>('account');
    const [emailCodeSent, setEmailCodeSent] = useState(false);
    const [otpDigits, setOtpDigits] = useState<string[]>(
        () => Array.from({ length: OTP_LENGTH }, () => ''),
    );
    const [stepMessage, setStepMessage] = useState<string | null>(null);
    const [stepMessageTone, setStepMessageTone] = useState<StepMessageTone>('info');
    const [error, setError] = useState<string | null>(null);
    const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const lastAutoVerifiedCodeRef = useRef<string | null>(null);

    const emailRequired = status?.requiredVerifications.includes('EMAIL_OTP') ?? false;
    const identityRequired = status?.requiredVerifications.includes('IDENTITY_VERIFICATION') ?? false;
    const gatesComplete = status?.gatesComplete
        ?? ((!emailRequired || Boolean(status?.emailVerified))
            && (!identityRequired || Boolean(status?.identityVerified)));

    const wizardSteps = useMemo(() => (
        status
            ? buildWizardSteps(status, emailRequired, identityRequired, gatesComplete, stage)
            : []
    ), [emailRequired, gatesComplete, identityRequired, stage, status]);
    const otpCode = otpDigits.join('');

    useEffect(() => {
        let active = true;

        async function loadInvite() {
            try {
                const [preview] = await Promise.all([
                    callInviteApi<InviteStatus>(token, '/preview'),
                    callInviteApi<InviteStatus>(token, '/open'),
                ]);

                if (active) {
                    setStatus(preview);
                    if (preview.gatesComplete || !preview.requiredVerifications.length) {
                        setStage('accept');
                    }
                }

                const session = await fetchCurrentUser();
                if (!active) return;

                if (session.status === 'unauthenticated') {
                    redirectToLogin(`/invitations/${token}`);
                    return;
                }

                if (session.status === 'unavailable') {
                    setError(session.message);
                    return;
                }

                const gateStatus = await callInviteApi<InviteStatus>(token, '/status');
                if (!active) return;

                const returnedFromIdentityChallenge = new URLSearchParams(
                    window.location.search,
                ).get('identityReturn') === '1';

                if (
                    returnedFromIdentityChallenge &&
                    gateStatus.requiredVerifications.includes('IDENTITY_VERIFICATION') &&
                    !gateStatus.identityVerified
                ) {
                    const syncedStatus = await callInviteApi<InviteStatus>(
                        token,
                        '/identity/complete',
                    );
                    if (!active) return;
                    setStatus(syncedStatus);
                    setStage(syncedStatus.identityVerified ? 'accept' : 'identity');
                    if (syncedStatus.identityVerified) {
                        setStepMessageTone('success');
                        setStepMessage('Identity verification confirmed.');
                    }
                    return;
                }

                setStatus(gateStatus);
                if (gateStatus.gatesComplete || !gateStatus.requiredVerifications.length) {
                    setStage('accept');
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
        setStepMessage(null);

        try {
            const nextStatus = await callInviteApi<InviteStatus>(token, '/email-code/send');
            setStatus(nextStatus);
            setEmailCodeSent(true);
            setOtpDigits(Array.from({ length: OTP_LENGTH }, () => ''));
            setStepMessageTone('success');
            setStepMessage(`Verification code sent to ${nextStatus.email}.`);
            window.setTimeout(() => otpInputRefs.current[0]?.focus(), 80);
        } catch (sendError) {
            setStepMessageTone('error');
            setStepMessage(sendError instanceof Error
                ? sendError.message
                : 'Unable to send verification code.');
        } finally {
            setWorking(false);
        }
    }

    const handleVerifyEmailCode = useCallback(async (code: string) => {
        setWorking(true);
        setError(null);
        setStepMessage(null);

        try {
            const nextStatus = await callInviteApi<InviteStatus>(token, '/email-code/verify', {
                code,
            });
            setStatus(nextStatus);
            setOtpDigits(Array.from({ length: OTP_LENGTH }, () => ''));
            setStepMessageTone('success');
            setStepMessage('Email verified.');
            setStage(identityRequired && !nextStatus.identityVerified ? 'identity' : 'accept');
        } catch (verifyError) {
            setStepMessageTone('error');
            setStepMessage(verifyError instanceof Error
                ? verifyError.message
                : 'Unable to verify code.');
            setOtpDigits(Array.from({ length: OTP_LENGTH }, () => ''));
            lastAutoVerifiedCodeRef.current = null;
            window.setTimeout(() => otpInputRefs.current[0]?.focus(), 80);
        } finally {
            setWorking(false);
        }
    }, [identityRequired, token]);

    async function handleCompleteIdentity() {
        setWorking(true);
        setError(null);
        setStepMessage(null);

        try {
            const session = await fetchCurrentUser();
            if (session.status !== 'authenticated') {
                const returnUrl = `${MEETINGS_URL}/invitations/${token}`;
                window.location.href = `${APP_URL}/verify-identity?challenge=invitation&next=${encodeURIComponent(returnUrl)}`;
                return;
            }

            const nextStatus = await callInviteApi<InviteStatus>(token, '/identity/complete');
            setStatus(nextStatus);
            if (nextStatus.identityVerified) {
                setStepMessageTone('success');
                setStepMessage('Identity verification confirmed.');
                setStage('accept');
                return;
            }

            const returnUrl = `${MEETINGS_URL}/invitations/${token}?identityReturn=1`;
            window.location.href = `${APP_URL}/verify-identity?challenge=invitation&next=${encodeURIComponent(returnUrl)}`;
        } catch (identityError) {
            setError(identityError instanceof Error
                ? identityError.message
                : 'Unable to complete identity verification.');
        } finally {
            setWorking(false);
        }
    }

    function handleContinueFromAccount() {
        if (!status) return;
        setError(null);
        setStepMessage(null);
        setStage(getNextStageAfterAccount(status, emailRequired, identityRequired));
    }

    function handleOtpChange(index: number, value: string) {
        const digits = getOtpDigits(value);
        if (!digits.length && value) return;

        setOtpDigits((currentDigits) => {
            const nextDigits = [...currentDigits];

            if (!digits.length) {
                nextDigits[index] = '';
                return nextDigits;
            }

            digits.forEach((digit, digitIndex) => {
                if (index + digitIndex < OTP_LENGTH) {
                    nextDigits[index + digitIndex] = digit;
                }
            });

            return nextDigits;
        });

        const nextIndex = Math.min(index + Math.max(digits.length, 1), OTP_LENGTH - 1);
        if (digits.length) {
            window.setTimeout(() => otpInputRefs.current[nextIndex]?.focus(), 0);
        }
    }

    function handleOtpKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    }

    function handleOtpPaste(event: ClipboardEvent<HTMLInputElement>) {
        event.preventDefault();
        const digits = getOtpDigits(event.clipboardData.getData('text'));
        if (!digits.length) return;

        setOtpDigits((currentDigits) => {
            const nextDigits = [...currentDigits];
            digits.forEach((digit, index) => {
                nextDigits[index] = digit;
            });
            return nextDigits;
        });

        window.setTimeout(() => {
            otpInputRefs.current[Math.min(digits.length, OTP_LENGTH) - 1]?.focus();
        }, 0);
    }

    useEffect(() => {
        const codeIsReady = stage === 'email'
            && emailCodeSent
            && otpCode.length === OTP_LENGTH
            && !working
            && !status?.emailVerified;

        if (!codeIsReady || lastAutoVerifiedCodeRef.current === otpCode) return;

        lastAutoVerifiedCodeRef.current = otpCode;
        void handleVerifyEmailCode(otpCode);
    }, [emailCodeSent, handleVerifyEmailCode, otpCode, stage, status?.emailVerified, working]);

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
                <section
                    className={styles.loadingCard}
                    aria-busy="true"
                    aria-live="polite"
                >
                    <div className={styles.loadingHeader}>
                        <span className={styles.loadingMark} aria-hidden="true">
                            <span className={styles.loadingOrbit} />
                            <Video size={22} />
                        </span>
                        <div>
                            <p className={styles.eyebrow}>Secure invitation</p>
                            <h1>Preparing your meeting access</h1>
                            <p>
                                We are checking the invitation link, your session, and any
                                required verification gates.
                            </p>
                        </div>
                    </div>

                    <div className={styles.loadingProgress} aria-hidden="true">
                        <span />
                    </div>

                    <div className={styles.loadingChecklist} aria-hidden="true">
                        <span>
                            <LockKeyhole size={15} />
                            Validating secure link
                        </span>
                        <span>
                            <ShieldCheck size={15} />
                            Checking verification rules
                        </span>
                        <span>
                            <UserRoundCheck size={15} />
                            Confirming signed-in account
                        </span>
                    </div>

                    <div className={styles.loadingPreview} aria-hidden="true">
                        <span />
                        <span />
                        <span />
                    </div>
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

                    {stage === 'account' && (
                        <div className={styles.stagePanel}>
                            <div className={styles.stepPanelHeader}>
                                <span className={styles.stepIcon}>
                                    <UserRoundCheck size={20} />
                                </span>
                                <div>
                                    <strong>Signed in as invited account</strong>
                                    <p>{status.email}</p>
                                </div>
                            </div>
                            <div className={styles.accountGrid}>
                                <div>
                                    <span>Invitation email</span>
                                    <strong>{status.email}</strong>
                                </div>
                                <div>
                                    <span>Required checks</span>
                                    <strong>
                                        {status.requiredVerifications.length
                                            ? `${status.requiredVerifications.length} selected`
                                            : 'Session only'}
                                    </strong>
                                </div>
                            </div>
                            <button
                                type="button"
                                className={styles.primaryAction}
                                disabled={working}
                                onClick={handleContinueFromAccount}
                            >
                                <span>{status.requiredVerifications.length ? 'Continue securely' : 'Review invitation'}</span>
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    )}

                    {stage === 'email' && emailRequired && (
                        <div className={status.emailVerified ? styles.completePanel : styles.stagePanel}>
                            <div className={styles.stepPanelHeader}>
                                <span className={styles.stepIcon}>
                                    <MailCheck size={20} />
                                </span>
                                <div>
                                    <strong>Email verification</strong>
                                    <p>
                                        {status.emailVerified
                                            ? 'Email confirmed.'
                                            : 'Send a one-time code to the invited email, then enter the six digits.'}
                                    </p>
                                </div>
                            </div>
                            {!status.emailVerified && (
                                <>
                                    <button
                                        type="button"
                                        className={styles.panelAction}
                                        disabled={working}
                                        onClick={handleSendEmailCode}
                                    >
                                        {emailCodeSent ? 'Resend verification code' : 'Send verification code'}
                                    </button>

                                    {emailCodeSent && (
                                        <div className={styles.otpBlock}>
                                            <div className={styles.otpGrid} aria-label="Email verification code">
                                                {otpDigits.map((digit, index) => (
                                                    <input
                                                        // The index is stable because OTP length is fixed.
                                                        key={`email-otp-${index}`}
                                                        ref={(element) => {
                                                            otpInputRefs.current[index] = element;
                                                        }}
                                                        value={digit}
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        maxLength={1}
                                                        aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                                                        className={styles.otpInput}
                                                        onChange={(event) => handleOtpChange(index, event.target.value)}
                                                        onKeyDown={(event) => handleOtpKeyDown(index, event)}
                                                        onPaste={handleOtpPaste}
                                                    />
                                                ))}
                                            </div>
                                            <p className={styles.otpHint}>
                                                The code verifies automatically after the sixth digit.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {stage === 'identity' && identityRequired && (
                        <div className={status.identityVerified ? styles.completePanel : styles.stagePanel}>
                            <div className={styles.stepPanelHeader}>
                                <span className={styles.stepIcon}>
                                    <ShieldCheck size={20} />
                                </span>
                                <div>
                                    <strong>Identity verification</strong>
                                    <p>
                                        {status.identityVerified
                                            ? 'Identity confirmed.'
                                            : 'Confirm your Gracon verified identity before accepting this room.'}
                                    </p>
                                </div>
                            </div>
                            {!status.identityVerified && (
                                <button
                                    type="button"
                                    className={styles.panelAction}
                                    disabled={working}
                                    onClick={handleCompleteIdentity}
                                >
                                    Verify identity
                                </button>
                            )}
                        </div>
                    )}

                    {stage === 'accept' && !status.requiredVerifications.length && (
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

                    {stage === 'accept' && status.requiredVerifications.length > 0 && (
                        <div className={styles.completePanel}>
                            <div className={styles.stepPanelHeader}>
                                <span className={styles.stepIcon}>
                                    <CheckCircle2 size={20} />
                                </span>
                                <div>
                                    <strong>Verification complete</strong>
                                    <p>All host-selected checks are complete for this invited account.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {stepMessage && (
                        <p className={`${styles.stepMessage} ${styles[`${stepMessageTone}Message`]}`}>
                            {stepMessage}
                        </p>
                    )}
                    {error && <p className={styles.error}>{error}</p>}

                    {stage === 'accept' && (
                        <button
                            type="button"
                            className={styles.primaryAction}
                            disabled={working || !status.canAccept || !gatesComplete}
                            onClick={handleAccept}
                        >
                            <span>{working ? 'Processing...' : 'Accept invitation'}</span>
                            <ArrowRight size={16} />
                        </button>
                    )}
                </section>
            </section>
        </main>
    );
}
