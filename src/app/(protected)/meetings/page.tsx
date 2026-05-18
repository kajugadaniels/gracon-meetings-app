/**
 * Initial protected meetings dashboard.
 */
import type { Metadata } from 'next';
import styles from './meetings-page.module.css';

export const metadata: Metadata = {
    title: 'Meetings',
    description: 'Secure Gracon 360 meeting workspace.',
};

/**
 * Renders the first meetings workspace screen before live-call features land.
 */
export default function MeetingsPage() {
    return (
        <section className={styles.hero}>
            <div className={styles.panel}>
                <p className={styles.eyebrow}>Secure meetings</p>
                <h1 className={styles.title}>
                    Host, schedule, invite, and record Gracon meetings.
                </h1>
                <p className={styles.copy}>
                    The foundation is now protected by the shared Gracon session
                    model. Next milestones will connect meeting creation,
                    Stream call tokens, invitations, recording metadata, and
                    audit logs.
                </p>
            </div>

            <div className={styles.grid}>
                <article className={styles.card}>
                    <h2 className={styles.cardTitle}>Create meetings</h2>
                    <p className={styles.cardCopy}>
                        Instant and scheduled meeting records will be owned by
                        api/meetings while users remain owned by api/auth.
                    </p>
                </article>
                <article className={styles.card}>
                    <h2 className={styles.cardTitle}>Invite securely</h2>
                    <p className={styles.cardCopy}>
                        Invite links will use hashed tokens, expiry, revocation,
                        and email notifications.
                    </p>
                </article>
                <article className={styles.card}>
                    <h2 className={styles.cardTitle}>Record with audit</h2>
                    <p className={styles.cardCopy}>
                        Recording actions and playback access will be logged for
                        compliance and traceability.
                    </p>
                </article>
            </div>
        </section>
    );
}
