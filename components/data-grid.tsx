'use client'

import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetSummary } from '@/features/summary/api/use-get-summary'
import { cn, formatCurrency, formatDateRange } from '@/lib/utils'

import { CountUp } from './count-up'

const Amount = ({
    value,
    className,
}: {
    value: number
    className?: string
}) => (
    <span className={cn('font-mono tabular-nums tracking-tight', className)}>
        <CountUp
            preserveValue
            start={0}
            end={value}
            decimals={2}
            decimalPlaces={2}
            formattingFn={formatCurrency}
        />
    </span>
)

export const DataGrid = () => {
    const { data, isLoading } = useGetSummary()
    const searchParams = useSearchParams()
    const to = searchParams.get('to') || undefined
    const from = searchParams.get('from') || undefined
    const dateRangeLabel = formatDateRange({ to, from })

    if (isLoading) return <DataGridLoading />

    const income = data?.incomeAmount ?? 0
    const expenses = Math.abs(data?.expensesAmount ?? 0)
    const remaining = data?.remainingAmount ?? 0
    const spentShare = income > 0 ? Math.min(expenses / income, 1) : 0
    const spentPct = income > 0 ? Math.round((expenses / income) * 100) : 0

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="relative overflow-hidden p-5 lg:col-span-6 lg:p-6">
                <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-muted-foreground">
                        Left to spend
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                        {dateRangeLabel}
                    </p>
                </div>

                <Amount
                    value={remaining}
                    className={cn(
                        'mt-3 block text-4xl font-semibold lg:text-[44px] leading-tight',
                        remaining < 0 && 'text-expense'
                    )}
                />

                <div className="mt-6 space-y-2">
                    {/* biome-ignore lint/a11y/useSemanticElements: native <meter> cannot be styled consistently across browsers. */}
                    <div
                        className="flex h-2 overflow-hidden rounded-full bg-brand-soft"
                        role="meter"
                        aria-label="Share of income spent"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.min(spentPct, 100)}
                    >
                        <div
                            className={cn(
                                'h-full rounded-full transition-[width] duration-700 ease-out',
                                spentPct >= 100 ? 'bg-expense' : 'bg-foreground'
                            )}
                            style={{ width: `${spentShare * 100}%` }}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {income > 0 ? (
                            <>
                                <span className="font-medium text-foreground tabular-nums">
                                    {spentPct}%
                                </span>{' '}
                                of income spent
                                {spentPct > 100 && ', you are over budget'}
                            </>
                        ) : expenses > 0 ? (
                            'No income recorded for this period yet.'
                        ) : (
                            'Nothing recorded for this period yet.'
                        )}
                    </p>
                </div>
            </Card>

            <StatCard
                label="Income"
                value={income}
                icon={ArrowDownLeft}
                tone="income"
            />
            <StatCard
                label="Expenses"
                value={expenses}
                icon={ArrowUpRight}
                tone="expense"
            />
        </div>
    )
}

type StatCardProps = {
    label: string
    value: number
    icon: typeof ArrowUpRight
    tone: 'income' | 'expense'
}

const StatCard = ({ label, value, icon: Icon, tone }: StatCardProps) => (
    <Card className="flex flex-col justify-between gap-6 p-5 lg:col-span-3 lg:p-6">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <span
                className={cn(
                    'flex size-8 items-center justify-center rounded-full',
                    tone === 'income'
                        ? 'bg-income/10 text-income'
                        : 'bg-expense/10 text-expense'
                )}
            >
                <Icon className="size-4" />
            </span>
        </div>
        <Amount value={value} className="text-2xl font-semibold" />
    </Card>
)

export const DataGridLoading = () => (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="space-y-4 p-5 lg:col-span-6 lg:p-6">
            <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-11 w-56" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-4 w-40" />
        </Card>
        {[0, 1].map((i) => (
            <Card key={i} className="space-y-8 p-5 lg:col-span-3 lg:p-6">
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="size-8 rounded-full" />
                </div>
                <Skeleton className="h-7 w-36" />
            </Card>
        ))}
    </div>
)
