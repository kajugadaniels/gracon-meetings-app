/**
 * Invite dialog for live meeting rooms.
 */
'use client';

import { Check, Copy, MailCheck, Search, ShieldCheck, UserCheck, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    createMeetingInvite,
    getUserPreferences,
    searchMeetingUsersByEmail,
} from '@/lib/meetings/api-client';
import type { MeetingRoomAttendeeView } from '@/lib/meetings/meeting-view-models';
import type {
    MeetingInviteVerificationRequirement as ApiMeetingInviteVerificationRequirement,
    MeetingUserSearchResult,
    UserInviteVerificationPreference,
} from '@/lib/meetings/types';
import styles from './meeting-invite-dialog.module.css';

interface MeetingInviteDialogProps {
    meetingId: string;
    attendees: MeetingRoomAttendeeView[];
    onClose: () => void;
}

type MeetingInviteVerificationRequirement = 'NONE' | 'EMAIL_OTP' | 'IDENTITY_VERIFICATION';
type ActiveMeetingInviteVerificationRequirement = Exclude<MeetingInviteVerificationRequirement, 'NONE'>;

const VERIFICATION_OPTIONS: Array<{
    value: MeetingInviteVerificationRequirement;
    label: string;
    description: string;
    icon: typeof ShieldCheck;
}> = [
    {
        value: 'NONE',
        label: 'No extra verification',
        description: 'Recipient can join after signing in with their Gracon account.',
        icon: UserCheck,
    },
    {
        value: 'EMAIL_OTP',
        label: 'Email verification',
        description: 'Recipient confirms the invited email with a one-time code before joining.',
        icon: MailCheck,
    },
    {
        value: 'IDENTITY_VERIFICATION',
        label: 'Identity verification',
        description: 'Recipient must pass the identity challenge before accepting the meeting invite.',
        icon: ShieldCheck,
    },
];

const DEFAULT_VERIFICATION_REQUIREMENTS: ActiveMeetingInviteVerificationRequirement[] = [];
const ACTIVE_VERIFICATION_FALLBACK: ActiveMeetingInviteVerificationRequirement[] = ['EMAIL_OTP'];
const MIN_EMAIL_SEARCH_LENGTH = 3;

/**
 * Detects real API meeting ids so seeded rooms can stay local-only.
 */
function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Resolves the public room URL without leaking backend URLs to invitees.
 */
function getMeetingPublicUrl(meetingId: string): string {
    const configuredBaseUrl = process.env.NEXT_PUBLIC_MEETINGS_PUBLIC_URL
        || process.env.NEXT_PUBLIC_MEETINGS_URL;
    const runtimeBaseUrl = typeof window === 'undefined'
        ? 'http://localhost:4003'
        : window.location.origin;
    const baseUrl = (configuredBaseUrl || runtimeBaseUrl).replace(/\/$/, '');

    return `${baseUrl}/meetings/${encodeURIComponent(meetingId)}`;
}

/**
 * Converts auth-owned meeting preference values into API invite gate values.
 */
function mapMeetingPreferenceToRequirements(
    preferences: UserInviteVerificationPreference[],
): ActiveMeetingInviteVerificationRequirement[] {
    if (preferences.includes('NO_VERIFICATION')) return [];

    return (['EMAIL_OTP', 'IDENTITY_VERIFICATION'] as const).filter((requirement) =>
        preferences.includes(requirement),
    );
}

/**
 * Renders the in-meeting invite flow with local invitee search.
 */
export function MeetingInviteDialog({
    meetingId,
    attendees,
    onClose,
}: MeetingInviteDialogProps) {
    const [inviteSearch, setInviteSearch] = useState('');
    const [defaultVerificationRequirements, setDefaultVerificationRequirements] =
        useState<ActiveMeetingInviteVerificationRequirement[]>(DEFAULT_VERIFICATION_REQUIREMENTS);
    const [verificationRequirements, setVerificationRequirements] =
        useState<ActiveMeetingInviteVerificationRequirement[]>(
            DEFAULT_VERIFICATION_REQUIREMENTS,
        );
    const [searchResults, setSearchResults] = useState<MeetingUserSearchResult[]>([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [invitedEmails, setInvitedEmails] = useState<Set<string>>(() => new Set());
    const [sendingEmails, setSendingEmails] = useState<Set<string>>(() => new Set());
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const verificationTouchedRef = useRef(false);
    const meetingLink = getMeetingPublicUrl(meetingId);
    const noExtraVerification = verificationRequirements.length === 0;
    const apiBackedMeeting = isUuid(meetingId);

    const attendeeEmails = useMemo(
        () => new Set(attendees.map((attendee) => attendee.email.toLowerCase())),
        [attendees],
    );
    const visibleInvitees = useMemo(() => (
        searchResults.filter((result) => !attendeeEmails.has(result.email.toLowerCase()))
    ), [attendeeEmails, searchResults]);
    const searchStatus = useMemo(() => {
        const trimmedSearch = inviteSearch.trim();

        if (trimmedSearch.length === 0) {
            return 'Search by email to invite an existing verified Gracon user.';
        }

        if (trimmedSearch.length < MIN_EMAIL_SEARCH_LENGTH) {
            return `Type at least ${MIN_EMAIL_SEARCH_LENGTH} characters to search by email.`;
        }

        if (searchingUsers) return 'Searching verified users...';
        if (searchError) return searchError;
        if (visibleInvitees.length === 0) return 'No verified users match that email search.';
        return `${visibleInvitees.length} verified user${visibleInvitees.length === 1 ? '' : 's'} found`;
    }, [inviteSearch, searchError, searchingUsers, visibleInvitees.length]);

    useEffect(() => {
        let cancelled = false;

        getUserPreferences()
            .then((preferences) => {
                if (cancelled) return;

                const nextDefaults = mapMeetingPreferenceToRequirements(
                    preferences.defaultMeetingInviteVerifications,
                );

                setDefaultVerificationRequirements(nextDefaults);
                if (!verificationTouchedRef.current) {
                    setVerificationRequirements(nextDefaults);
                }
            })
            .catch(() => {
                // Keep the local no-verification fallback; api/meetings still enforces invite gates.
            });

        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        const normalizedSearch = inviteSearch.trim();

        if (normalizedSearch.length < MIN_EMAIL_SEARCH_LENGTH) {
            return;
        }

        let cancelled = false;
        const timeout = window.setTimeout(() => {
            setSearchingUsers(true);
            setSearchError(null);

            searchMeetingUsersByEmail(normalizedSearch)
                .then((users) => {
                    if (cancelled) return;
                    setSearchResults(users);
                })
                .catch((err) => {
                    if (cancelled) return;
                    setSearchResults([]);
                    setSearchError(
                        err instanceof Error ? err.message : 'Unable to search verified users.',
                    );
                })
                .finally(() => {
                    if (!cancelled) setSearchingUsers(false);
                });
        }, 240);

        return () => {
            cancelled = true;
            window.clearTimeout(timeout);
        };
    }, [inviteSearch]);

    async function markInvited(invitee: MeetingUserSearchResult) {
        setInviteError(null);

        if (!apiBackedMeeting) {
            setInvitedEmails((currentEmails) => new Set(currentEmails).add(invitee.email));
            return;
        }

        setSendingEmails((currentEmails) => new Set(currentEmails).add(invitee.email));

        try {
            await createMeetingInvite(meetingId, {
                email: invitee.email,
                invitedUserId: invitee.id,
                requiredVerifications: verificationRequirements as ApiMeetingInviteVerificationRequirement[],
            });
            setInvitedEmails((currentEmails) => new Set(currentEmails).add(invitee.email));
        } catch (err) {
            setInviteError(
                err instanceof Error ? err.message : 'Unable to send this meeting invitation.',
            );
        } finally {
            setSendingEmails((currentEmails) => {
                const nextEmails = new Set(currentEmails);
                nextEmails.delete(invitee.email);
                return nextEmails;
            });
        }
    }

    function handleInviteSearchChange(value: string) {
        setInviteSearch(value);

        if (value.trim().length < MIN_EMAIL_SEARCH_LENGTH) {
            setSearchResults([]);
            setSearchingUsers(false);
            setSearchError(null);
        }
    }

    function setNoExtraVerification(enabled: boolean) {
        verificationTouchedRef.current = true;
        setVerificationRequirements(
            enabled
                ? []
                : defaultVerificationRequirements.length > 0
                  ? defaultVerificationRequirements
                  : ACTIVE_VERIFICATION_FALLBACK,
        );
    }

    function toggleVerificationRequirement(
        requirement: ActiveMeetingInviteVerificationRequirement,
    ) {
        verificationTouchedRef.current = true;
        setVerificationRequirements((currentRequirements) => {
            if (currentRequirements.includes(requirement)) {
                return currentRequirements.filter((item) => item !== requirement);
            }

            return [...currentRequirements, requirement];
        });
    }

    async function copyMeetingLink() {
        await navigator.clipboard.writeText(meetingLink);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
    }

    return (
        <div
            className={styles.dialogOverlay}
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section className={styles.inviteDialog} role="dialog" aria-modal="true" aria-labelledby="invite-title">
                <div className={styles.dialogHeader}>
                    <div>
                        <p className={styles.eyebrow}>Invite people</p>
                        <h2 id="invite-title">Bring someone into this room</h2>
                        <p>Choose who can join and what proof they must complete before accepting.</p>
                    </div>
                    <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close invite dialog">
                        <X size={16} />
                    </button>
                </div>

                <div className={styles.inviteLink}>
                    <div>
                        <span>Meeting link</span>
                        <strong>{meetingLink}</strong>
                    </div>
                    <button type="button" onClick={() => void copyMeetingLink()}>
                        {copied ? <Check size={15} /> : <Copy size={15} />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>

                {inviteError && <p className={styles.inviteError}>{inviteError}</p>}

                <div className={styles.verificationPanel}>
                    <div className={styles.sectionHead}>
                        <div>
                            <span>Required verification</span>
                            <strong>Before accepting invitation</strong>
                        </div>
                        <p>Login is always required. Select the extra gates for this invite.</p>
                        {apiBackedMeeting && <p>Invites are sent through Gracon email.</p>}
                    </div>

                    <div className={styles.verificationGrid}>
                        {VERIFICATION_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            const isNoneOption = option.value === 'NONE';
                            const requirement = isNoneOption
                                ? null
                                : option.value as Exclude<MeetingInviteVerificationRequirement, 'NONE'>;
                            const checked = isNoneOption
                                ? noExtraVerification
                                : Boolean(requirement && verificationRequirements.includes(requirement));
                            const disabled = !isNoneOption && noExtraVerification;

                            return (
                                <label
                                    key={option.value}
                                    className={`${styles.verificationOption} ${
                                        checked ? styles.verificationOptionChecked : ''
                                    } ${
                                        disabled ? styles.verificationOptionDisabled : ''
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        name="meeting-invite-verification"
                                        value={option.value}
                                        checked={checked}
                                        disabled={disabled}
                                        onChange={() => {
                                            if (isNoneOption) {
                                                setNoExtraVerification(!noExtraVerification);
                                            } else if (requirement) {
                                                toggleVerificationRequirement(requirement);
                                            }
                                        }}
                                    />
                                    <span className={styles.optionIcon}>
                                        <Icon size={16} />
                                    </span>
                                    <span>
                                        <strong>{option.label}</strong>
                                        <small>{option.description}</small>
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className={styles.inviteePanel}>
                    <div className={styles.searchRow}>
                        <label className={styles.inviteSearch}>
                            <Search size={16} />
                            <span>Search invitees</span>
                            <input
                                value={inviteSearch}
                                onChange={(event) => handleInviteSearchChange(event.target.value)}
                                inputMode="email"
                                placeholder="Search verified user email..."
                            />
                        </label>
                    </div>

                    <p className={styles.searchStatus}>{searchStatus}</p>

                    <div className={styles.inviteList}>
                        {visibleInvitees.map((invitee) => {
                            const invited = invitedEmails.has(invitee.email);
                            const sending = sendingEmails.has(invitee.email);

                            return (
                                <article key={invitee.id}>
                                    <span className={styles.avatar}>{invitee.initials}</span>
                                    <div>
                                        <strong>{invitee.displayName}</strong>
                                        <small>{invitee.email}</small>
                                    </div>
                                    <button
                                        type="button"
                                        className={invited ? styles.invitedButton : ''}
                                        disabled={sending}
                                        onClick={() => void markInvited(invitee)}
                                    >
                                        {sending ? (
                                            'Sending...'
                                        ) : invited ? (
                                            <>
                                                <Check size={14} />
                                                Invited
                                            </>
                                        ) : (
                                            'Invite'
                                        )}
                                    </button>
                                </article>
                            );
                        })}
                    </div>

                    {visibleInvitees.length === 0 && inviteSearch.trim().length >= MIN_EMAIL_SEARCH_LENGTH && !searchingUsers && (
                        <p className={styles.emptyState}>
                            Search only returns active identity-verified users by email.
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}
