/**
 * Login page for the Gracon meetings workspace.
 */
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from '@/components/pages/auth/login';
import styles from './login-page.module.css';

export const metadata: Metadata = {
    title: 'Sign In',
    description: 'Sign in to access Gracon 360 Meetings.',
};

/**
 * Renders the standalone meetings login page used for local development.
 */
export default function LoginPage() {
    return (
        <main className={styles.shell}>
            <div className={styles.content}>
                <div className={styles.brand}>
                    <div className={styles.brandRow}>
                        <div className={styles.brandMark}>G</div>
                        <span className={styles.brandName}>Gracon 360</span>
                    </div>
                    <p className={styles.product}>Meetings Workspace</p>
                </div>

                <Suspense>
                    <LoginForm />
                </Suspense>
            </div>
        </main>
    );
}
