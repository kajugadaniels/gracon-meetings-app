/**
 * Client trigger for opening the reusable schedule meeting dialog.
 */
'use client';

import { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
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
                <CalendarPlus size={15} />
                Schedule meeting
            </button>

            {open && <ScheduleMeetingDialog onClose={() => setOpen(false)} />}
        </>
    );
}
