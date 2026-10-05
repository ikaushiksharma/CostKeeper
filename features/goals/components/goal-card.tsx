import { CalendarClock } from 'lucide-react'
import Link from 'next/link'

import { Card } from '@/components/ui/card'
import {
    KIND_COPY,
    periodLabel,
    periodProgress,
    pickCurrentPeriod,
} from '@/lib/goals'
import { cn, formatCurrency } from '@/lib/utils'
import type { Goal } from '../api/shared'
import { GoalMeter } from './goal-meter'
import { HealthBadge, StatusBadge } from './health-badge'

const formatRupees = (value: number) =>
    formatCurrency(value).replace(/\.00$/, '')

export const GoalCard = ({ goal }: { goal: Goal }) => {
    const period = pickCurrentPeriod(goal.periods)
    const copy = KIND_COPY[goal.kind]
    const progress = period ? periodProgress(goal.kind, period) : null
    const needsNext = !!progress?.isPast && goal.status === 'active'

    return (
        <Link
            href={`/goals/${goal.id}`}
            className="group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <Card className="flex h-full flex-col gap-5 p-5 transition-colors group-hover:border-foreground/20">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                        <h3 className="truncate font-semibold">{goal.name}</h3>
                        <p className="text-xs text-muted-foreground">
                            {copy.label}
                            {period &&
                                ` · ${period.label || periodLabel(period)}`}
                        </p>
                    </div>
                    {goal.status !== 'active' ? (
                        <StatusBadge status={goal.status} />
                    ) : (
                        progress && <HealthBadge health={progress.health} />
                    )}
                </div>

                {progress ? (
                    <div className="space-y-3">
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
                                {formatRupees(Math.abs(progress.remaining))}
                            </p>
                            <p
                                className={cn(
                                    'text-sm text-muted-foreground',
                                    progress.remaining < 0 &&
                                        goal.kind === 'allowance' &&
                                        'text-expense'
                                )}
                            >
                                {progress.remaining >= 0
                                    ? copy.remaining
                                    : copy.over}
                            </p>
                        </div>
                        <GoalMeter
                            kind={goal.kind}
                            progress={progress}
                            label={`${goal.name} progress`}
                        />
                        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                            <span className="tabular-nums">
                                {formatRupees(progress.done)} {copy.done} of{' '}
                                {formatRupees(progress.required)}
                            </span>
                            {needsNext ? (
                                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                    <CalendarClock className="size-3.5" />
                                    Period ended
                                </span>
                            ) : (
                                progress.isCurrent && (
                                    <span className="tabular-nums">
                                        {progress.daysLeft} days left
                                    </span>
                                )
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No period yet. Open the goal to set a target.
                    </p>
                )}
            </Card>
        </Link>
    )
}
