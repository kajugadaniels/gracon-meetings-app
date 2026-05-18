/**
 * Shared card primitive copied from the documents workspace.
 */
import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    strength?: 'default' | 'strong';
    padding?: 'sm' | 'md' | 'lg' | 'none';
}

const paddingMap = {
    none: '0',
    sm: '16px',
    md: '28px',
    lg: '40px',
};

/**
 * Renders a Gracon glass card using shared global primitives.
 */
export function Card({
    children,
    strength = 'default',
    padding = 'md',
    style,
    ...rest
}: CardProps) {
    return (
        <div
            className={strength === 'strong' ? 'glass-strong' : 'glass'}
            style={{
                borderRadius: 'var(--radius-lg)',
                padding: paddingMap[padding],
                ...style,
            }}
            {...rest}
        >
            {children}
        </div>
    );
}
