/**
 * Invite dialog for the static meeting room.
 */
'use client';

import { Copy, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { MeetingRoomAttendeeView } from '@/lib/meetings/static-meetings';
import styles from './meeting-invite-dialog.module.css';

interface MeetingInviteDialogProps {
    meetingId: string;
    attendees: MeetingRoomAttendeeView[];
    onClose: () => void;
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

    const visibleInvitees = useMemo(() => {
        const normalizedSearch = inviteSearch.trim().toLowerCase();
        const candidates = attendees.slice(0, 8);

        if (normalizedSearch.length < 2) return candidates;

        return candidates.filter((attendee) => (
            attendee.name.toLowerCase().includes(normalizedSearch)
            || attendee.email.toLowerCase().includes(normalizedSearch)
        ));
    }, [attendees, inviteSearch]);

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
                    </div>
                    <button type="button" onClick={onClose}>Close</button>
                </div>

                <label className={styles.inviteSearch}>
                    <Search size={16} />
                    <span>Search invitees</span>
                    <input
                        value={inviteSearch}
                        onChange={(event) => setInviteSearch(event.target.value)}
                        placeholder="Search by name or email..."
                    />
                </label>

                <div className={styles.inviteLink}>
                    <div>
                        <span>Meeting link</span>
                        <strong>https://meet.gracon360.com/{meetingId}</strong>
                    </div>
                    <button type="button">
                        <Copy size={15} />
                        Copy
                    </button>
                </div>

                <div className={styles.inviteList}>
                    {visibleInvitees.map((attendee) => (
                        <article key={attendee.email}>
                            <span>{attendee.initials}</span>
                            <div>
                                <strong>{attendee.name}</strong>
                                <small>{attendee.email}</small>
                            </div>
                            <button type="button">Invite</button>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
