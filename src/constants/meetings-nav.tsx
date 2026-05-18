/**
 * Navigation registry for the protected meetings workspace.
 */
import {
    CalendarClock,
    History,
    Home,
    type LucideIcon,
    Radio,
    Video,
} from 'lucide-react';

export interface MeetingsNavItem {
    href: string;
    label: string;
    description: string;
    icon: LucideIcon;
}

export const MEETINGS_NAV_ITEMS: MeetingsNavItem[] = [
    {
        href: '/home',
        label: 'Home',
        description: 'Create meetings and continue active work.',
        icon: Home,
    },
    {
        href: '/upcoming',
        label: 'Upcoming',
        description: 'Scheduled meetings waiting to start.',
        icon: CalendarClock,
    },
    {
        href: '/previous',
        label: 'Previous',
        description: 'Completed and ended meeting history.',
        icon: History,
    },
    {
        href: '/recordings',
        label: 'Recordings',
        description: 'Recorded meetings and playback access.',
        icon: Video,
    },
    {
        href: '/personal-room',
        label: 'Personal room',
        description: 'Your reusable always-available room.',
        icon: Radio,
    },
];
