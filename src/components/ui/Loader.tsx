/**
 * Shared loader primitive for app/meetings buttons and loading states.
 */
'use client';

interface PremiumLoaderProps {
    size?: number;
    color?: 'primary' | 'white';
}

/**
 * Renders the same orbital loader used by the documents login button.
 */
export function PremiumLoader({
    size = 18,
    color = 'white',
}: PremiumLoaderProps) {
    const rgb = color === 'primary' ? '91,35,255' : '255,255,255';
    const thickness = Math.max(2.5, size * 0.14);

    return (
        <span
            aria-hidden="true"
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                display: 'inline-block',
                flexShrink: 0,
                background: [
                    'conic-gradient(',
                    '  from 0deg,',
                    `  rgba(${rgb},0.00)  0deg,`,
                    `  rgba(${rgb},0.04)  80deg,`,
                    `  rgba(${rgb},0.22) 200deg,`,
                    `  rgba(${rgb},0.70) 295deg,`,
                    `  rgba(${rgb},1.00) 348deg,`,
                    `  rgba(${rgb},0.00) 360deg`,
                    ')',
                ].join(''),
                WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), black calc(100% - ${thickness}px))`,
                mask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), black calc(100% - ${thickness}px))`,
                animation: 'premium-spin 0.82s linear infinite',
            }}
        />
    );
}
