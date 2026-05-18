/**
 * Shared placeholder surface for meeting sections that are not implemented yet.
 */
import styles from './meetings-placeholder-page.module.css';

interface MeetingsPlaceholderPageProps {
    title: string;
    eyebrow: string;
    copy: string;
}

/**
 * Renders a polished empty state for future meetings sections.
 */
export function MeetingsPlaceholderPage({
    title,
    eyebrow,
    copy,
}: MeetingsPlaceholderPageProps) {
    return (
        <section className={styles.shell}>
            <div className={styles.panel}>
                <p className={styles.eyebrow}>{eyebrow}</p>
                <h1>{title}</h1>
                <p>{copy}</p>
            </div>
        </section>
    );
}
