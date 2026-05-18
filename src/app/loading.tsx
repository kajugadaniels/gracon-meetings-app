/**
 * App-level loading fallback for meetings route transitions.
 */
import { MeetingsLoadingState } from '@/components/ui/MeetingsLoadingState';

/**
 * Renders the shared meetings loading state while Next.js prepares a route.
 */
export default function Loading() {
    return (
        <MeetingsLoadingState
            title="Preparing meetings..."
            copy="Loading the next secure workspace surface."
            detail="Route transition protected"
        />
    );
}
