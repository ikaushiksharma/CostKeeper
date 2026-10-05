import { type GoalHealth, HEALTH_COPY } from '@/lib/goals'
import { cn } from '@/lib/utils'

export const HealthBadge = ({
    health,
    className,
}: {
    health: GoalHealth
    className?: string
}) => {
    const { label, tone } = HEALTH_COPY[health]
    return (
        <span
            className={cn(
                'inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-medium',
                tone === 'good' && 'bg-brand-soft text-brand',
                tone === 'neutral' && 'bg-muted text-muted-foreground',
                tone === 'bad' && 'bg-expense/10 text-expense',
                className
            )}
        >
            {label}
        </span>
    )
}

export const StatusBadge = ({ status }: { status: 'paused' | 'archived' }) => (
    <span className="inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-xs font-medium text-muted-foreground">
        {status === 'paused' ? 'Paused' : 'Archived'}
    </span>
)
