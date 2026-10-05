import Link from 'next/link'

import { cn } from '@/lib/utils'

/*
 * "The Keep": a coin cut by a ledger rule. The half below the rule is filled
 * with the brand accent, standing for the part of the money you keep.
 * Colours come from tokens so the mark inverts cleanly in dark mode.
 */
export const LogoMark = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
        className={cn('size-7 shrink-0', className)}
    >
        <rect width="32" height="32" rx="9" fill="hsl(var(--primary))" />
        <path d="M7 16a9 9 0 0 0 18 0Z" fill="hsl(var(--brand))" />
        <circle
            cx="16"
            cy="16"
            r="9"
            stroke="hsl(var(--primary-foreground))"
            strokeWidth="2.25"
        />
        <path
            d="M4.5 16h23"
            stroke="hsl(var(--primary-foreground))"
            strokeWidth="2.25"
            strokeLinecap="round"
        />
    </svg>
)

export const Logo = ({ className }: { className?: string }) => (
    <Link
        href="/"
        className={cn(
            'flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className
        )}
    >
        <LogoMark />
        <span className="text-[17px] font-semibold tracking-tight">
            CostKeeper
        </span>
    </Link>
)
