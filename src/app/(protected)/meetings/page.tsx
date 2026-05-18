/**
 * Backward-compatible redirect from the old meetings route.
 */
import { redirect } from 'next/navigation';

/**
 * Sends older links to the new meetings home route.
 */
export default function MeetingsPage() {
    redirect('/home');
}
