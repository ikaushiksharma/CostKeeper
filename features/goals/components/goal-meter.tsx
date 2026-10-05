import type { GoalKind, PeriodProgress } from '@/lib/goals'
import { cn } from '@/lib/utils'

type GoalMeterProps = {
    kind: GoalKind
    progress: Pick<
        PeriodProgress,
        'ratio' | 'expected' | 'required' | 'health' | 'isCurrent'
    >
    label: string
    className?: string
}

// Same visual language as the Overview "left to spend" meter. A tick marks
// where steady progress would be today.
export const GoalMeter = ({
    kind,
    progress,
    label,
    className,
}: GoalMeterProps) => {
    const pct = Math.min(progress.ratio, 1) * 100
    const paceAt =
        progress.isCurrent && progress.required > 0
            ? Math.min(progress.expected / progress.required, 1) * 100
            : null
    const bad =
        progress.health === 'behind' ||
        progress.health === 'missed' ||
        progress.health === 'exceeded' ||
        progress.health === 'fast'

    return (
        <div className={cn('relative', className)}>
            {/* biome-ignore lint/a11y/useSemanticElements: native <meter> cannot be styled consistently across browsers. */}
            <div
                role="meter"
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(Math.min(progress.ratio, 1) * 100)}
                className="h-2 overflow-hidden rounded-full bg-brand-soft"
            >
                <div
                    className={cn(
                        'h-full rounded-full transition-[width] duration-700 ease-out',
                        bad
                            ? 'bg-expense'
                            : kind === 'allowance'
                              ? 'bg-foreground'
                              : 'bg-brand'
                    )}
                    style={{ width: `${pct}%` }}
                />
            </div>
            {paceAt !== null && paceAt > 0 && paceAt < 100 && (
                <span
                    aria-hidden
                    title="Where steady progress would be today"
                    className="absolute -top-1 h-4 w-0.5 rounded-full bg-foreground/40"
                    style={{ left: `calc(${paceAt}% - 1px)` }}
                />
            )}
        </div>
    )
}
