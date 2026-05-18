/**
 * Shared loading state for meetings session, route, and room preparation flows.
 */
import { ShieldCheck, Video } from 'lucide-react';
import styles from './meetings-loading-state.module.css';

interface MeetingsLoadingStateProps {
    title?: string;
    copy?: string;
    detail?: string;
}

/**
 * Renders a branded meetings loading state with clear security context.
 */
export function MeetingsLoadingState({
    title = 'Opening meetings workspace...',
    copy = 'Checking your secure Gracon session',
    detail = 'Encrypted session check',
}: MeetingsLoadingStateProps) {
    return (
        <section className={styles.shell} aria-live="polite" aria-busy="true">
            <div className={styles.card}>
                <div className={styles.mark} aria-hidden="true">
                    <span className={styles.orbit} />
                    <Video size={22} />
                </div>

                <div className={styles.copy}>
                    <p className={styles.eyebrow}>Gracon meetings</p>
                    <h1>{title}</h1>
                    <p>{copy}</p>
                </div>

                <div className={styles.progressTrack} aria-hidden="true">
                    <span />
                </div>

                <div className={styles.securityNote}>
                    <ShieldCheck size={15} />
                    <span>{detail}</span>
                </div>
            </div>
        </section>
    );
}
