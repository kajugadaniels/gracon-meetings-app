/**
 * Root layout for the Gracon meetings app.
 */
import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import { AppToaster } from '@/components/ui';
import './globals.css';

const dmSans = DM_Sans({
    variable: '--font-dm-sans',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: {
        default: 'Meetings | Gracon 360',
        template: '%s | Gracon 360',
    },
    description: 'Secure Gracon 360 video meetings workspace.',
};

/**
 * Provides global font and document structure.
 */
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={dmSans.variable}>
            <body>
                {children}
                <AppToaster />
            </body>
        </html>
    );
}
