/**
 * Personal room page.
 */
import type { Metadata } from 'next';
import {
    CalendarPlus,
    Copy,
    DoorOpen,
    Link2,
    LockKeyhole,
    Play,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';
import styles from './page.module.css';

const ROOM_LINK = 'gracon360.com/meet/daniel-kajuga';

const ROOM_SETTINGS = [
    {
        label: 'Waiting room',
        value: 'Enabled',
        copy: 'Guests wait until you admit them.',
        icon: DoorOpen,
    },
    {
        label: 'Host control',
        value: 'Required',
        copy: 'Room cannot start before the owner joins.',
        icon: LockKeyhole,
    },
    {
        label: 'Guest access',
        value: 'Invite link',
        copy: 'Anyone with approval can request to join.',
        icon: Link2,
    },
    {
        label: 'Room audit',
        value: 'Tracked',
        copy: 'Starts, joins, and shares will be recorded.',
        icon: ShieldCheck,
    },
];

const RECENT_GUESTS = ['DK', 'OU', 'RN', 'IM', 'BK'];

export const metadata: Metadata = {
    title: 'Personal Room',
    description: 'Reusable Gracon personal meeting room.',
};

/**
 * Renders a static personal room management surface.
 */
export default function PersonalRoomPage() {
    return (
        <section className={styles.page}>
            <header className={styles.hero}>
                <div>
                    <p className={styles.eyebrow}>Personal room</p>
                    <h1>Your reusable room for quick trusted meetings.</h1>
                    <p>
                        Keep a stable Gracon meeting link ready for partners, teams, and
                        verified guests without creating a new room every time.
                    </p>
                </div>

                <aside className={styles.roomCard} aria-label="Personal room link">
                    <span>Permanent room link</span>
                    <strong>{ROOM_LINK}</strong>
                    <div className={styles.roomActions}>
                        <button type="button">
                            <Play size={15} fill="currentColor" />
                            Start room
                        </button>
                        <button type="button">
                            <Copy size={15} />
                            Copy link
                        </button>
                    </div>
                </aside>
            </header>

            <section className={styles.quickPanel} aria-label="Quick personal room actions">
                <button type="button">
                    <CalendarPlus size={18} />
                    Schedule with this room
                </button>
                <button type="button">
                    <UsersRound size={18} />
                    Invite guests
                </button>
                <button type="button">
                    <ShieldCheck size={18} />
                    Review access
                </button>
            </section>

            <section className={styles.contentGrid}>
                <div className={styles.settingsGrid} aria-label="Personal room settings">
                    {ROOM_SETTINGS.map((setting) => {
                        const Icon = setting.icon;
                        return (
                            <article key={setting.label} className={styles.settingCard}>
                                <Icon size={19} />
                                <div>
                                    <span>{setting.label}</span>
                                    <strong>{setting.value}</strong>
                                    <p>{setting.copy}</p>
                                </div>
                            </article>
                        );
                    })}
                </div>

                <aside className={styles.sidePanel} aria-label="Room readiness">
                    <p className={styles.eyebrow}>Room readiness</p>
                    <h2>Ready for secure meetings</h2>
                    <ul>
                        <li>Personal room link is active</li>
                        <li>Waiting room protects unscheduled joins</li>
                        <li>Host permission is required before entry</li>
                        <li>Recording remains off until the host enables it</li>
                    </ul>

                    <div className={styles.guestBlock}>
                        <span>Recent guests</span>
                        <div className={styles.avatarStack}>
                            {RECENT_GUESTS.map((guest) => (
                                <strong key={guest}>{guest}</strong>
                            ))}
                        </div>
                    </div>
                </aside>
            </section>
        </section>
    );
}
