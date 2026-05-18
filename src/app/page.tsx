/**
 * Root route for app/meetings.
 */
import { redirect } from 'next/navigation';

/**
 * Sends users to the protected meetings workspace.
 */
export default function Home() {
    redirect('/home');
}
