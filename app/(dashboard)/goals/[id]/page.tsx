'use client'

import {
    Archive,
    ArrowLeft,
    CalendarPlus,
    MoreHorizontal,
    Pause,
    Pencil,
    Play,
    Plus,
    RotateCcw,
    Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { DataTable } from '@/components/data-table'
import { EmptyState } from '@/components/empty-state'
import { Segmented } from '@/components/segmented'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetContributions } from '@/features/goals/api/use-get-contributions'
import { useGetGoal } from '@/features/goals/api/use-get-goal'
import { useEditGoal } from '@/features/goals/api/use-edit-goal'
import { GoalMeter } from '@/features/goals/components/goal-meter'
import { GoalStats } from '@/features/goals/components/goal-stats'
import {
    HealthBadge,
    StatusBadge,
} from '@/features/goals/components/health-badge'
import { useContributionSheet } from '@/features/goals/hooks/use-contribution-sheet'
import { useGoalSheet } from '@/features/goals/hooks/use-goal-sheet'
import { usePeriodSheet } from '@/features/goals/hooks/use-period-sheet'
import { useBulkDeleteTransactions } from '@/features/transactions/api/use-bulk-delete-transactions'
import {
    CADENCE_LABEL,
    KIND_COPY,
    periodLabel,
    periodProgress,
    pickCurrentPeriod,
} from '@/lib/goals'
import { cn, formatCurrency } from '@/lib/utils'
import { columns } from './columns'

const formatRupees = (value: number) =>
    formatCurrency(value).replace(/\.00$/, '')

const ACTION_LABEL = {
    save: 'Add money',
    payoff: 'Log payment',
    allowance: 'Log spending',
} as const

const GoalPage = () => {
    const { id } = useParams<{ id: string }>()
    const goalQuery = useGetGoal(id)
    const goal = goalQuery.data
    const editMutation = useEditGoal(id)
    const deleteTransactions = useBulkDeleteTransactions()
    const contributionSheet = useContributionSheet()
    const periodSheet = usePeriodSheet()
    const goalSheet = useGoalSheet()

    const [periodId, setPeriodId] = useState<string>()
    const current = useMemo(
        () => (goal ? pickCurrentPeriod(goal.periods) : undefined),
        [goal]
    )
    // Default to the current period, and fall back if the picked one is deleted.
    useEffect(() => {
        if (!goal) return
        if (!periodId || !goal.periods.some((p) => p.id === periodId)) {
            setPeriodId(current?.id)
        }
    }, [goal, current, periodId])

    const period = goal?.periods.find((p) => p.id === periodId) ?? current
    const contributionsQuery = useGetContributions(id, period)

    if (goalQuery.isLoading) return <GoalPageSkeleton />

    if (!goal) {
        return (
            <Card>
                <EmptyState
                    icon={Wallet}
                    title="Goal not found"
                    description="It may have been deleted."
                    action={
                        <Button size="sm" variant="outline" asChild>
                            <Link href="/goals">Back to goals</Link>
                        </Button>
                    }
                />
            </Card>
        )
    }

    const copy = KIND_COPY[goal.kind]
    const progress = period ? periodProgress(goal.kind, period) : null
    const latest = goal.periods[goal.periods.length - 1]
    const latestProgress = latest ? periodProgress(goal.kind, latest) : null
    const needsNext = goal.status === 'active' && !!latestProgress?.isPast
    const perDay =
        progress?.isCurrent &&
        goal.kind !== 'allowance' &&
        progress.remaining > 0 &&
        progress.daysLeft > 0
            ? progress.remaining / progress.daysLeft
            : null

    return (
        <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                    <Link
                        href="/goals"
                        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <ArrowLeft className="size-4" /> All goals
                    </Link>
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold tracking-tight">
                            {goal.name}
                        </h2>
                        {goal.status !== 'active' && (
                            <StatusBadge status={goal.status} />
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {copy.label} · {CADENCE_LABEL[goal.cadence]}
                        {goal.account && ` · from ${goal.account}`}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => periodSheet.onOpen(goal.id)}
                    >
                        <CalendarPlus className="size-4" /> Next period
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => contributionSheet.onOpen(goal.id)}
                    >
                        <Plus className="size-4" /> {ACTION_LABEL[goal.kind]}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-9"
                                aria-label="More goal actions"
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-44">
                            <DropdownMenuItem
                                onClick={() => goalSheet.onOpen(goal.id)}
                            >
                                <Pencil className="mr-2 size-4" /> Edit goal
                            </DropdownMenuItem>
                            {period && (
                                <DropdownMenuItem
                                    onClick={() =>
                                        periodSheet.onOpen(goal.id, period.id)
                                    }
                                >
                                    <CalendarPlus className="mr-2 size-4" />{' '}
                                    Edit this period
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {goal.status === 'active' && (
                                <DropdownMenuItem
                                    onClick={() =>
                                        editMutation.mutate({
                                            status: 'paused',
                                        })
                                    }
                                >
                                    <Pause className="mr-2 size-4" /> Pause
                                </DropdownMenuItem>
                            )}
                            {goal.status !== 'active' && (
                                <DropdownMenuItem
                                    onClick={() =>
                                        editMutation.mutate({
                                            status: 'active',
                                        })
                                    }
                                >
                                    {goal.status === 'paused' ? (
                                        <Play className="mr-2 size-4" />
                                    ) : (
                                        <RotateCcw className="mr-2 size-4" />
                                    )}
                                    {goal.status === 'paused'
                                        ? 'Resume'
                                        : 'Restore'}
                                </DropdownMenuItem>
                            )}
                            {goal.status !== 'archived' && (
                                <DropdownMenuItem
                                    onClick={() =>
                                        editMutation.mutate({
                                            status: 'archived',
                                        })
                                    }
                                >
                                    <Archive className="mr-2 size-4" /> Archive
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {needsNext && latest && latestProgress && (
                <Card className="flex flex-col gap-3 border-brand/40 bg-brand-soft/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                        <p className="text-sm font-medium">
                            {latest.label || periodLabel(latest)} has ended
                        </p>
                        <p className="text-sm text-muted-foreground tabular-nums">
                            You {copy.done} {formatRupees(latestProgress.done)}{' '}
                            of {formatRupees(latestProgress.required)}. Start
                            the next period to keep tracking.
                        </p>
                    </div>
                    <Button
                        size="sm"
                        variant="brand"
                        onClick={() => periodSheet.onOpen(goal.id)}
                    >
                        Start next period
                    </Button>
                </Card>
            )}

            {goal.periods.length > 1 && (
                <div className="flex items-center gap-3">
                    {goal.periods.length <= 4 ? (
                        <Segmented
                            label="Period"
                            value={period?.id ?? ''}
                            onChange={setPeriodId}
                            options={goal.periods.map((p) => ({
                                value: p.id,
                                label: p.label || periodLabel(p),
                            }))}
                        />
                    ) : (
                        <Select value={period?.id} onValueChange={setPeriodId}>
                            <SelectTrigger className="w-56" aria-label="Period">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[...goal.periods].reverse().map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.label || periodLabel(p)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            )}

            {period && progress ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    <Card className="space-y-5 p-5 lg:col-span-6 lg:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-muted-foreground">
                                {period.label || periodLabel(period)}
                            </p>
                            <HealthBadge health={progress.health} />
                        </div>
                        <div>
                            <p
                                className={cn(
                                    'font-mono text-4xl font-semibold tabular-nums tracking-tight lg:text-[44px] leading-tight',
                                    progress.remaining < 0 &&
                                        goal.kind === 'allowance' &&
                                        'text-expense'
                                )}
                            >
                                {formatRupees(Math.abs(progress.remaining))}
                            </p>
                            <p className="text-sm text-muted-foreground">
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
                        <p className="text-sm text-muted-foreground tabular-nums">
                            <span className="font-medium text-foreground">
                                {Math.round(progress.ratio * 100)}%
                            </span>{' '}
                            {copy.done}
                            {progress.isCurrent &&
                                `, ${progress.daysLeft} days left`}
                            {perDay !== null &&
                                `. About ${formatRupees(Math.ceil(perDay))} a day to finish on time.`}
                        </p>
                    </Card>

                    <Stat
                        label={goal.kind === 'allowance' ? 'Budget' : 'Target'}
                        value={formatRupees(progress.required)}
                        note={
                            period.carryIn !== 0
                                ? `${formatRupees(period.targetAmount)} ${period.carryIn > 0 ? '+' : '-'} ${formatRupees(Math.abs(period.carryIn))} carried`
                                : undefined
                        }
                    />
                    <Stat
                        label={copy.done[0].toUpperCase() + copy.done.slice(1)}
                        value={formatRupees(progress.done)}
                        note={`${period.count} ${period.count === 1 ? 'entry' : 'entries'}`}
                    />
                </div>
            ) : (
                <Card>
                    <EmptyState
                        icon={CalendarPlus}
                        title="No period yet"
                        description="Add a period with a target to start tracking."
                        action={
                            <Button
                                size="sm"
                                onClick={() => periodSheet.onOpen(goal.id)}
                            >
                                Add period
                            </Button>
                        }
                    />
                </Card>
            )}

            <GoalStats goal={goal} />

            {period && (
                <Card className="p-4 lg:px-6 lg:py-5">
                    <h3 className="mb-3 text-base font-semibold">
                        {goal.kind === 'allowance'
                            ? 'Spending'
                            : 'Contributions'}
                    </h3>
                    {contributionsQuery.isLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-full sm:max-w-xs" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                    ) : (
                        <DataTable
                            filterKey="payee"
                            filterPlaceholder="Search descriptions"
                            columns={columns}
                            data={contributionsQuery.data ?? []}
                            amountKey="amount"
                            disabled={deleteTransactions.isPending}
                            onDelete={(rows) =>
                                deleteTransactions.mutate({
                                    ids: rows.map((r) => r.original.id),
                                })
                            }
                            emptyState={
                                <EmptyState
                                    icon={Wallet}
                                    title={`Nothing logged for ${period.label || periodLabel(period)}`}
                                    description="Each entry you log here moves the meter above."
                                    action={
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                contributionSheet.onOpen(
                                                    goal.id
                                                )
                                            }
                                        >
                                            <Plus className="size-4" />{' '}
                                            {ACTION_LABEL[goal.kind]}
                                        </Button>
                                    }
                                />
                            }
                        />
                    )}
                </Card>
            )}
        </div>
    )
}

const Stat = ({
    label,
    value,
    note,
}: {
    label: string
    value: string
    note?: string
}) => (
    <Card className="flex flex-col justify-between gap-6 p-5 lg:col-span-3 lg:p-6">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="space-y-1">
            <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
                {value}
            </p>
            {note && (
                <p className="text-xs text-muted-foreground tabular-nums">
                    {note}
                </p>
            )}
        </div>
    </Card>
)

const GoalPageSkeleton = () => (
    <div className="space-y-6">
        <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="space-y-4 p-6 lg:col-span-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-11 w-56" />
                <Skeleton className="h-2 w-full rounded-full" />
            </Card>
            <Card className="h-36 p-6 lg:col-span-3">
                <Skeleton className="h-4 w-16" />
            </Card>
            <Card className="h-36 p-6 lg:col-span-3">
                <Skeleton className="h-4 w-16" />
            </Card>
        </div>
    </div>
)

export default GoalPage
