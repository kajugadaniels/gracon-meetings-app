/**
 * Client trigger for opening the reusable schedule meeting dialog.
 */
'use client';

import { useState } from 'react';
import { ScheduleMeetingDialog } from './ScheduleMeetingDialog';
import styles from './upcoming-schedule-button.module.css';

/**
 * Renders the upcoming page schedule trigger and its dialog state.
 */
export function UpcomingScheduleButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                className={styles.scheduleButton}
                onClick={() => setOpen(true)}
            >
                Schedule meeting
            </button>

            {open && <ScheduleMeetingDialog onClose={() => setOpen(false)} />}
        </>
    );
}
