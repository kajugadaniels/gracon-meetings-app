/**
 * Invite dialog for the static meeting room.
 */
'use client';

import { Check, Copy, MailCheck, Search, ShieldCheck, UserCheck, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { MeetingRoomAttendeeView } from '@/lib/meetings/static-meetings';
import styles from './meeting-invite-dialog.module.css';

interface MeetingInviteDialogProps {
    meetingId: string;
    attendees: MeetingRoomAttendeeView[];
    onClose: () => void;
}

type MeetingInviteVerificationRequirement = 'NONE' | 'EMAIL_OTP' | 'IDENTITY_VERIFICATION';

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

const DEFAULT_VERIFICATION_REQUIREMENTS: Exclude<MeetingInviteVerificationRequirement, 'NONE'>[] = ['EMAIL_OTP'];

/**
 * Renders the in-meeting invite flow with local invitee search.
 */
export function MeetingInviteDialog({
    meetingId,
    attendees,
    onClose,
}: MeetingInviteDialogProps) {
    const [inviteSearch, setInviteSearch] = useState('');
    const [verificationRequirements, setVerificationRequirements] =
        useState<Exclude<MeetingInviteVerificationRequirement, 'NONE'>[]>(
            DEFAULT_VERIFICATION_REQUIREMENTS,
        );
    const [invitedEmails, setInvitedEmails] = useState<Set<string>>(() => new Set());
    const [copied, setCopied] = useState(false);
    const meetingLink = `https://meet.gracon360.com/${meetingId}`;
    const noExtraVerification = verificationRequirements.length === 0;

    const visibleInvitees = useMemo(() => {
        const normalizedSearch = inviteSearch.trim().toLowerCase();
        const candidates = attendees.slice(0, 10);

        if (normalizedSearch.length < 2) return candidates;

        return candidates.filter((attendee) => (
            attendee.name.toLowerCase().includes(normalizedSearch)
            || attendee.email.toLowerCase().includes(normalizedSearch)
        ));
    }, [attendees, inviteSearch]);

    function markInvited(email: string) {
        setInvitedEmails((currentEmails) => new Set(currentEmails).add(email));
    }

    function setNoExtraVerification(enabled: boolean) {
        setVerificationRequirements(enabled ? [] : DEFAULT_VERIFICATION_REQUIREMENTS);
    }

    function toggleVerificationRequirement(
        requirement: Exclude<MeetingInviteVerificationRequirement, 'NONE'>,
    ) {
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

                <div className={styles.verificationPanel}>
                    <div className={styles.sectionHead}>
                        <div>
                            <span>Required verification</span>
                            <strong>Before accepting invitation</strong>
                        </div>
                        <p>Login is always required. Select one extra gate for this invite.</p>
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
                                onChange={(event) => setInviteSearch(event.target.value)}
                                placeholder="Search by name or email..."
                            />
                        </label>
                    </div>

                    <div className={styles.inviteList}>
                        {visibleInvitees.map((attendee) => {
                            const invited = invitedEmails.has(attendee.email);

                            return (
                                <article key={attendee.email}>
                                    <span className={styles.avatar}>{attendee.initials}</span>
                                    <div>
                                        <strong>{attendee.name}</strong>
                                        <small>{attendee.email}</small>
                                    </div>
                                    <button
                                        type="button"
                                        className={invited ? styles.invitedButton : ''}
                                        onClick={() => markInvited(attendee.email)}
                                    >
                                        {invited ? (
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

                    {visibleInvitees.length === 0 && (
                        <p className={styles.emptyState}>No invitees match that search.</p>
                    )}
                </div>
            </section>
        </div>
    );
}
