/**
 * Dialog for scheduling a meeting.
 */
import {
    CalendarDays,
    Clock3,
    Loader2,
    MailCheck,
    Search,
    ShieldCheck,
    UserCheck,
    UserPlus,
    X,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { MouseEvent, useEffect, useMemo, useState } from 'react';
import { toast } from '@/components/ui';
import {
    createMeeting,
    createMeetingInvite,
    searchMeetingUsersByEmail,
} from '@/lib/meetings/api-client';
import type {
    Meeting,
    MeetingInviteVerificationRequirement,
    MeetingUserSearchResult,
} from '@/lib/meetings/types';
import styles from './schedule-meeting-dialog.module.css';

interface ScheduleMeetingDialogProps {
    onClose: () => void;
    onScheduled?: (meeting: Meeting) => void;
}

type ScheduleVerificationOption = 'NONE' | MeetingInviteVerificationRequirement;

const MIN_EMAIL_SEARCH_LENGTH = 3;
const DEFAULT_VERIFICATIONS: MeetingInviteVerificationRequirement[] = ['EMAIL_OTP'];
const VERIFICATION_OPTIONS: Array<{
    value: ScheduleVerificationOption;
    label: string;
    description: string;
    icon: typeof ShieldCheck;
}> = [
    {
        value: 'NONE',
        label: 'No extra verification',
        description: 'Guests join after signing in with their Gracon account.',
        icon: UserCheck,
    },
    {
        value: 'EMAIL_OTP',
        label: 'Email verification',
        description: 'Guests confirm the invited email with a one-time code.',
        icon: MailCheck,
    },
    {
        value: 'IDENTITY_VERIFICATION',
        label: 'Identity verification',
        description: 'Guests must pass identity verification before accepting.',
        icon: ShieldCheck,
    },
];

/**
 * Returns today's date in a local date-input compatible format.
 */
function getTodayInputValue() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Builds a scheduled start timestamp from separate local date and time fields.
 */
function getScheduledDateTime(date: string, time: string) {
    if (!date || !time) return null;
    const scheduledAt = new Date(`${date}T${time}:00`);
    return Number.isNaN(scheduledAt.getTime()) ? null : scheduledAt;
}

/**
 * Renders the schedule meeting form dialog.
 */
export function ScheduleMeetingDialog({ onClose, onScheduled }: ScheduleMeetingDialogProps) {
    const [closing, setClosing] = useState(false);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(getTodayInputValue());
    const [time, setTime] = useState('');
    const [agenda, setAgenda] = useState('');
    const [guestSearch, setGuestSearch] = useState('');
    const [guestResults, setGuestResults] = useState<MeetingUserSearchResult[]>([]);
    const [selectedGuests, setSelectedGuests] = useState<MeetingUserSearchResult[]>([]);
    const [verificationRequirements, setVerificationRequirements] =
        useState<MeetingInviteVerificationRequirement[]>(DEFAULT_VERIFICATIONS);
    const [searchingGuests, setSearchingGuests] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const todayInputValue = useMemo(() => getTodayInputValue(), []);
    const noExtraVerification = verificationRequirements.length === 0;
    const selectedGuestEmails = useMemo(
        () => new Set(selectedGuests.map((guest) => guest.email.toLowerCase())),
        [selectedGuests],
    );
    const visibleGuestResults = useMemo(() => (
        guestResults.filter((guest) => !selectedGuestEmails.has(guest.email.toLowerCase()))
    ), [guestResults, selectedGuestEmails]);
    const guestSearchStatus = useMemo(() => {
        const normalizedSearch = guestSearch.trim();

        if (normalizedSearch.length === 0) {
            return 'Search by email to add verified Gracon guests.';
        }

        if (normalizedSearch.length < MIN_EMAIL_SEARCH_LENGTH) {
            return `Type at least ${MIN_EMAIL_SEARCH_LENGTH} characters to search by email.`;
        }

        if (searchingGuests) return 'Searching verified guests...';
        if (searchError) return searchError;
        if (visibleGuestResults.length === 0) return 'No verified guests match that email search.';
        return `${visibleGuestResults.length} guest${visibleGuestResults.length === 1 ? '' : 's'} found`;
    }, [guestSearch, searchError, searchingGuests, visibleGuestResults.length]);

    useEffect(() => {
        const normalizedSearch = guestSearch.trim();

        if (normalizedSearch.length < MIN_EMAIL_SEARCH_LENGTH) return undefined;

        let cancelled = false;
        const timeoutId = window.setTimeout(() => {
            setSearchingGuests(true);
            setSearchError(null);

            searchMeetingUsersByEmail(normalizedSearch)
                .then((users) => {
                    if (!cancelled) setGuestResults(users);
                })
                .catch((err) => {
                    if (cancelled) return;
                    setGuestResults([]);
                    setSearchError(
                        err instanceof Error ? err.message : 'Unable to search verified guests.',
                    );
                })
                .finally(() => {
                    if (!cancelled) setSearchingGuests(false);
                });
        }, 240);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [guestSearch]);

    function closeWithAnimation(force = false) {
        if (submitting && !force) return;
        setClosing(true);
        window.setTimeout(onClose, 140);
    }

    function handleOverlayMouseDown(event: MouseEvent<HTMLDivElement>) {
        if (event.target === event.currentTarget) {
            closeWithAnimation();
        }
    }

    /**
     * Updates guest search while clearing stale results below the live-search threshold.
     */
    function handleGuestSearchChange(value: string) {
        setGuestSearch(value);

        if (value.trim().length < MIN_EMAIL_SEARCH_LENGTH) {
            setGuestResults([]);
            setSearchingGuests(false);
            setSearchError(null);
        }
    }

    /**
     * Adds a verified guest to the scheduled invitation list.
     */
    function addGuest(guest: MeetingUserSearchResult) {
        setSelectedGuests((currentGuests) => {
            if (currentGuests.some((currentGuest) => currentGuest.id === guest.id)) {
                return currentGuests;
            }

            return [...currentGuests, guest];
        });
        setGuestSearch('');
        setGuestResults([]);
        setSearchError(null);
    }

    /**
     * Removes a guest before the scheduled meeting is created.
     */
    function removeGuest(guestId: string) {
        setSelectedGuests((currentGuests) => (
            currentGuests.filter((guest) => guest.id !== guestId)
        ));
    }

    /**
     * Enables or disables the no-extra-verification invite mode.
     */
    function setNoExtraVerification(enabled: boolean) {
        setVerificationRequirements(enabled ? [] : DEFAULT_VERIFICATIONS);
    }

    /**
     * Toggles a single extra verification gate for scheduled meeting guests.
     */
    function toggleVerificationRequirement(
        requirement: MeetingInviteVerificationRequirement,
    ) {
        setVerificationRequirements((currentRequirements) => {
            if (currentRequirements.includes(requirement)) {
                return currentRequirements.filter((item) => item !== requirement);
            }

            return [...currentRequirements, requirement];
        });
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);

        const scheduledStartAt = getScheduledDateTime(date, time);
        if (!scheduledStartAt || scheduledStartAt.getTime() <= Date.now()) {
            const message = 'Choose a future date and time for this meeting.';
            setFormError(message);
            toast.error('Invalid meeting time', { description: message });
            return;
        }

        setSubmitting(true);

        try {
            const scheduledEndAt = new Date(scheduledStartAt.getTime() + 60 * 60 * 1000);
            const meeting = await createMeeting({
                title: title.trim(),
                description: agenda.trim() || undefined,
                visibility: 'INVITE_ONLY',
                scheduledStartAt: scheduledStartAt.toISOString(),
                scheduledEndAt: scheduledEndAt.toISOString(),
                recordingEnabled: false,
                waitingRoomEnabled: true,
                joinBeforeHost: false,
            });

            await Promise.all(selectedGuests.map((guest) => (
                createMeetingInvite(meeting.id, {
                    email: guest.email,
                    invitedUserId: guest.id,
                    requiredVerifications: verificationRequirements,
                })
            )));

            toast.success('Meeting scheduled', {
                description: selectedGuests.length > 0
                    ? `${selectedGuests.length} guest${selectedGuests.length === 1 ? '' : 's'} invited.`
                    : 'Your meeting is ready in upcoming meetings.',
            });
            onScheduled?.(meeting);
            closeWithAnimation(true);
        } catch (err) {
            const message = err instanceof Error
                ? err.message
                : 'Unable to schedule this meeting right now.';
            setFormError(message);
            toast.error('Unable to schedule meeting', { description: message });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            className={`${styles.dialogOverlay} ${closing ? styles.dialogOverlayClosing : ''}`}
            role="presentation"
            onMouseDown={handleOverlayMouseDown}
        >
            <section
                className={`${styles.dialog} ${closing ? styles.dialogClosing : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="schedule-meeting-title"
            >
                <div className={styles.dialogHeader}>
                    <div>
                        <p>Schedule meeting</p>
                        <h2 id="schedule-meeting-title">Prepare the meeting before guests join.</h2>
                    </div>
                    <button
                        type="button"
                        className={styles.closeButton}
                        disabled={submitting}
                        onClick={() => closeWithAnimation()}
                        aria-label="Close dialog"
                    >
                        <X size={17} />
                    </button>
                </div>

                {formError && <p className={styles.errorMessage}>{formError}</p>}

                <form className={styles.dialogForm} onSubmit={handleSubmit}>
                    <label className={styles.field}>
                        <span>Meeting title</span>
                        <input
                            type="text"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Board review"
                            required
                        />
                    </label>
                    <div className={styles.formGrid}>
                        <label className={styles.field}>
                            <span>Date</span>
                            <input
                                type="date"
                                value={date}
                                min={todayInputValue}
                                onChange={(event) => setDate(event.target.value)}
                                required
                            />
                        </label>
                        <label className={styles.field}>
                            <span>Time</span>
                            <div className={styles.inputShell}>
                                <Clock3 size={16} />
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(event) => setTime(event.target.value)}
                                    required
                                />
                            </div>
                        </label>
                    </div>

                    <section className={styles.guestPanel} aria-label="Meeting guests">
                        <div className={styles.panelHeader}>
                            <div>
                                <span>Guests</span>
                                <strong>Invite verified users</strong>
                            </div>
                            <small>{selectedGuests.length} selected</small>
                        </div>

                        {selectedGuests.length > 0 && (
                            <div className={styles.guestChips} aria-label="Selected guests">
                                {selectedGuests.map((guest) => (
                                    <span key={guest.id} className={styles.guestChip}>
                                        {guest.initials}
                                        <em>{guest.email}</em>
                                        <button
                                            type="button"
                                            onClick={() => removeGuest(guest.id)}
                                            aria-label={`Remove ${guest.email}`}
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <label className={styles.searchField}>
                            <Search size={16} />
                            <span>Search guest by email</span>
                            <input
                                type="email"
                                value={guestSearch}
                                onChange={(event) => handleGuestSearchChange(event.target.value)}
                                placeholder="Search verified user email..."
                            />
                        </label>
                        <p className={styles.searchStatus}>{guestSearchStatus}</p>

                        {visibleGuestResults.length > 0 && (
                            <div className={styles.guestResults}>
                                {visibleGuestResults.map((guest) => (
                                    <article key={guest.id}>
                                        <span>{guest.initials}</span>
                                        <div>
                                            <strong>{guest.displayName}</strong>
                                            <small>{guest.email}</small>
                                        </div>
                                        <button type="button" onClick={() => addGuest(guest)}>
                                            <UserPlus size={14} />
                                            Add
                                        </button>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className={styles.verificationPanel} aria-label="Guest verification">
                        <div className={styles.panelHeader}>
                            <div>
                                <span>Verification</span>
                                <strong>Before guests accept</strong>
                            </div>
                            <small>Login is always required</small>
                        </div>

                        <div className={styles.verificationGrid}>
                            {VERIFICATION_OPTIONS.map((option) => {
                                const Icon = option.icon;
                                const isNoneOption = option.value === 'NONE';
                                const requirement = isNoneOption
                                    ? null
                                    : option.value as MeetingInviteVerificationRequirement;
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
                                        <span>
                                            <Icon size={16} />
                                        </span>
                                        <div>
                                            <strong>{option.label}</strong>
                                            <small>{option.description}</small>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </section>

                    <label className={styles.field}>
                        <span>Agenda</span>
                        <textarea
                            value={agenda}
                            onChange={(event) => setAgenda(event.target.value)}
                            placeholder="Add the main discussion points"
                            rows={4}
                        />
                    </label>

                    <div className={styles.dialogActions}>
                        <button type="button" disabled={submitting} onClick={() => closeWithAnimation()}>Cancel</button>
                        <button type="submit" disabled={submitting}>
                            {submitting ? (
                                <Loader2 size={15} className={styles.spinIcon} />
                            ) : (
                                <CalendarDays size={15} />
                            )}
                            {submitting ? 'Scheduling...' : 'Schedule'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
