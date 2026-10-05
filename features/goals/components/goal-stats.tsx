'use client'

import { subDays } from 'date-fns'
import { BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
    Bar,
    BarChart,
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'

import { EmptyState } from '@/components/empty-state'
import { Segmented } from '@/components/segmented'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
    BUCKET_NOUN,
    type Bucket,
    bucketOf,
    bucketRange,
    DEFAULT_SPAN,
    earliest,
    GRANULARITY_LABEL,
    type Granularity,
    plannedIn,
    rollUp,
} from '@/lib/goal-stats'
import { KIND_COPY } from '@/lib/goals'
import { cn, formatCurrency } from '@/lib/utils'
import { useGetGoalStats } from '../api/use-get-goal-stats'
import type { Goal } from '../api/shared'

// Five validated categorical slots (globals.css --chart-1..5). Colour follows
// the goal (fixed by creation order), never its rank in a given view. Goals
// past the fifth fold into "Other".
const SERIES = [1, 2, 3, 4, 5].map((i) => `hsl(var(--chart-${i}))`)
const OTHER_COLOR = 'hsl(var(--muted-foreground))'
const OTHER = '__other'

const rupees = (value: number) =>
    formatCurrency(Math.round(value)).replace(/\.00$/, '')
const compact = (value: number) =>
    `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value)}`

const axisTick = { fill: 'hsl(var(--muted-foreground))', fontSize: 12 }

type Range = 'current' | 'recent' | 'all'

const useBuckets = (
    granularity: Granularity,
    range: Range,
    rows: { month: string; goalId: string; total: number; count: number }[],
    periods: { startsOn: Date; endsOn: Date; targetAmount: number }[]
) =>
    useMemo(() => {
        const now = new Date()
        const lastPeriodEnd = periods.reduce<Date>(
            (acc, p) => (p.endsOn > acc ? p.endsOn : acc),
            now
        )
        // Include the current bucket and, when a period runs further, up to its end.
        const to = lastPeriodEnd > now ? lastPeriodEnd : now
        const all = bucketRange(earliest(rows, periods), to, granularity)
        if (range === 'all') return all
        if (range === 'current') return [bucketOf(now, granularity)]
        const currentIndex = all.findIndex(
            (b) => b.key === bucketOf(now, granularity).key
        )
        const end = currentIndex === -1 ? all.length : currentIndex + 1
        return all.slice(Math.max(end - DEFAULT_SPAN[granularity], 0), end)
    }, [granularity, range, rows, periods])

const Controls = ({
    granularity,
    setGranularity,
    range,
    setRange,
}: {
    granularity: Granularity
    setGranularity: (g: Granularity) => void
    range: Range
    setRange: (r: Range) => void
}) => (
    <div className="flex flex-wrap items-center gap-2">
        <Segmented
            label="Group by"
            value={granularity}
            onChange={setGranularity}
            options={(['month', 'quarter', 'half_year', 'year'] as const).map(
                (g) => ({
                    value: g,
                    label: GRANULARITY_LABEL[g],
                })
            )}
        />
        <Segmented
            label="Range"
            value={range}
            onChange={setRange}
            options={[
                {
                    value: 'current',
                    label: `This ${BUCKET_NOUN[granularity]}`,
                },
                { value: 'recent', label: `Last ${DEFAULT_SPAN[granularity]}` },
                { value: 'all', label: 'All time' },
            ]}
        />
    </div>
)

const Kpi = ({
    label,
    value,
    note,
    tone,
}: {
    label: string
    value: string
    note?: string
    tone?: 'good' | 'bad'
}) => (
    <div className="min-w-0 space-y-1 px-3 py-3 first:pl-0 last:pr-0 sm:px-5 sm:py-4 sm:first:pl-0 sm:last:pr-0">
        <dt className="text-xs text-muted-foreground sm:text-sm">{label}</dt>
        <dd className="font-mono text-base font-semibold tabular-nums tracking-tight sm:text-lg lg:text-2xl">
            {value}
        </dd>
        {note && (
            <dd
                className={cn(
                    'text-xs text-muted-foreground tabular-nums',
                    tone === 'good' && 'text-income',
                    tone === 'bad' && 'text-expense'
                )}
            >
                {note}
            </dd>
        )}
    </div>
)

// The three numbers sit in one horizontal strip above the chart, divided by
// hairlines rather than boxed as separate cards.
const STATS_LAYOUT = 'space-y-5'
const KPI_RAIL = 'grid divide-x border-y'
// Four tiles wrap to 2x2 on phones; vertical dividers only once they share a row.
const KPI_RAIL_FOUR =
    'grid grid-cols-2 border-y sm:grid-cols-4 sm:divide-x [&>*:nth-child(-n+2)]:border-b sm:[&>*:nth-child(-n+2)]:border-b-0 [&>*:nth-child(2)]:pr-0 [&>*:nth-child(3)]:pl-0 sm:[&>*:nth-child(2)]:pr-5 sm:[&>*:nth-child(3)]:pl-5'
const MAIN_COLUMN = 'min-w-0 space-y-4'

const changeNote = (current: number, previous: number, noun: string) => {
    if (previous <= 0)
        return current > 0 ? `Nothing the ${noun} before` : undefined
    const pct = Math.round(((current - previous) / previous) * 100)
    return `${pct >= 0 ? '+' : ''}${pct}% vs last ${noun}`
}

const ChartTooltip = ({
    active,
    payload,
    label,
    rows,
}: {
    active?: boolean
    payload?: { payload: Record<string, number | string> }[]
    label?: string
    rows: { key: string; name: string; color: string; dashed?: boolean }[]
}) => {
    if (!active || !payload?.length) return null
    const datum = payload[0].payload
    const shown = rows.filter((r) => Number(datum[r.key]) > 0 || r.dashed)
    return (
        <div className="min-w-48 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg">
            <div className="bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                {datum.label ?? label}
            </div>
            <div className="space-y-1 px-3 py-2">
                {shown.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Nothing logged
                    </p>
                )}
                {shown.map((r) => (
                    <div
                        key={r.key}
                        className="flex items-center justify-between gap-4"
                    >
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span
                                aria-hidden
                                className={cn(
                                    'size-2 rounded-full',
                                    r.dashed && 'rounded-none h-0.5 w-3'
                                )}
                                style={{ background: r.color }}
                            />
                            {r.name}
                        </span>
                        <span className="font-mono text-sm font-medium tabular-nums">
                            {rupees(Number(datum[r.key]) || 0)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

const StatsSkeleton = () => (
    <Card className="space-y-5 p-4 lg:p-6">
        <div className="flex justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-9 w-80" />
        </div>
        <div className={STATS_LAYOUT}>
            <div className={`${KPI_RAIL} grid-cols-3`}>
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="space-y-2 px-3 py-3 first:pl-0 last:pr-0 sm:px-5 sm:py-4 sm:first:pl-0 sm:last:pr-0"
                    >
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-6 w-28" />
                    </div>
                ))}
            </div>
            <Skeleton className={`${MAIN_COLUMN} h-[300px] w-full`} />
        </div>
    </Card>
)

/* ------------------------------------------------------------------ */
/* All goals: stacked bars by goal                                     */
/* ------------------------------------------------------------------ */

export const GoalsStats = ({ goals }: { goals: Goal[] }) => {
    const statsQuery = useGetGoalStats()
    const [granularity, setGranularity] = useState<Granularity>('month')
    const [range, setRange] = useState<Range>('recent')
    const [view, setView] = useState<'chart' | 'goals' | 'table'>('chart')

    const rows = statsQuery.data ?? []
    const allPeriods = useMemo(() => goals.flatMap((g) => g.periods), [goals])
    const buckets = useBuckets(granularity, range, rows, allPeriods)

    // Stable colour per goal by creation order; sixth goal on folds into Other.
    const series = useMemo(() => {
        const ordered = [...goals].sort(
            (a, b) =>
                new Date(a.createdAt ?? 0).getTime() -
                new Date(b.createdAt ?? 0).getTime()
        )
        return ordered.map((g, i) => ({
            goal: g,
            key: i < SERIES.length ? g.id : OTHER,
            name: i < SERIES.length ? g.name : 'Other',
            color: i < SERIES.length ? SERIES[i] : OTHER_COLOR,
        }))
    }, [goals])
    const seriesKeys = useMemo(() => {
        const seen = new Map<
            string,
            { key: string; name: string; color: string }
        >()
        for (const s of series) if (!seen.has(s.key)) seen.set(s.key, s)
        return [...seen.values()]
    }, [series])

    const data = useMemo(() => {
        const rolled = rollUp(rows, granularity)
        return buckets.map((bucket) => {
            const datum: Record<string, number | string> = {
                key: bucket.key,
                label: bucket.label,
                short: bucket.short,
            }
            let total = 0
            let invested = 0
            let spent = 0
            let planned = 0
            for (const s of series) {
                const cell = rolled.get(bucket.key)?.get(s.goal.id)
                const value = cell?.total ?? 0
                datum[s.key] = (Number(datum[s.key]) || 0) + value
                total += value
                if (s.goal.kind === 'allowance') spent += value
                else {
                    invested += value
                    planned += plannedIn(s.goal.periods, bucket)
                }
            }
            datum.total = total
            datum.invested = invested
            datum.spent = spent
            datum.planned = planned
            return datum
        })
    }, [rows, granularity, buckets, series])

    // The tiles always describe the current bucket against the previous one,
    // independent of the range shown in the chart.
    const kpi = useMemo(() => {
        const rolled = rollUp(rows, granularity)
        const currentBucket = bucketOf(new Date(), granularity)
        const previousBucket = bucketOf(
            subDays(currentBucket.start, 1),
            granularity
        )
        const totals = (bucket: Bucket) => {
            let invested = 0
            let spent = 0
            let planned = 0
            for (const s of series) {
                const value = rolled.get(bucket.key)?.get(s.goal.id)?.total ?? 0
                if (s.goal.kind === 'allowance') spent += value
                else {
                    invested += value
                    planned += plannedIn(s.goal.periods, bucket)
                }
            }
            return { invested, spent, planned }
        }
        // Every goal kind (save, pay off, allowance) for the calendar year,
        // whatever grouping is selected.
        const yearBucket = bucketOf(new Date(), 'year')
        const yearRolled = rollUp(rows, 'year')
        let yearPlanned = 0
        let yearDone = 0
        for (const s of series) {
            yearPlanned += plannedIn(s.goal.periods, yearBucket)
            yearDone +=
                yearRolled.get(yearBucket.key)?.get(s.goal.id)?.total ?? 0
        }
        return {
            current: totals(currentBucket),
            previous: totals(previousBucket),
            year: {
                label: yearBucket.label,
                planned: yearPlanned,
                done: yearDone,
            },
        }
    }, [rows, granularity, series])

    // Range totals per goal for the "By goal" view.
    const byGoal = useMemo(() => {
        const rolled = rollUp(rows, granularity)
        return series
            .map((s, i) => {
                let total = 0
                let count = 0
                let planned = 0
                for (const bucket of buckets) {
                    const cell = rolled.get(bucket.key)?.get(s.goal.id)
                    total += cell?.total ?? 0
                    count += cell?.count ?? 0
                    planned += plannedIn(s.goal.periods, bucket)
                }
                return {
                    id: s.goal.id,
                    name: s.goal.name,
                    kind: s.goal.kind,
                    // Every goal keeps its own colour here; only the stacked
                    // chart folds the sixth goal on into "Other".
                    color: i < SERIES.length ? SERIES[i] : OTHER_COLOR,
                    total,
                    count,
                    planned,
                }
            })
            .sort((a, b) => b.total - a.total)
    }, [rows, granularity, buckets, series])

    if (statsQuery.isLoading) return <StatsSkeleton />

    const noun = BUCKET_NOUN[granularity]
    const current = kpi.current
    const previous = kpi.previous
    const hasData = data.some((d) => Number(d.total) > 0)
    const pctOfPlan =
        current && Number(current.planned) > 0
            ? Math.round(
                  (Number(current.invested) / Number(current.planned)) * 100
              )
            : null

    return (
        <Card className="space-y-5 p-4 lg:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-base font-semibold">Stats</h2>
                <Controls
                    granularity={granularity}
                    setGranularity={setGranularity}
                    range={range}
                    setRange={setRange}
                />
            </div>

            {!hasData ? (
                <EmptyState
                    icon={BarChart3}
                    title="No contributions in this range"
                    description="Stats fill in as you log money toward your goals."
                />
            ) : (
                <div className={STATS_LAYOUT}>
                    {current && (
                        <dl className={KPI_RAIL_FOUR}>
                            <Kpi
                                label={`Saved and paid this ${noun}`}
                                value={rupees(Number(current.invested))}
                                note={
                                    previous &&
                                    changeNote(
                                        Number(current.invested),
                                        Number(previous.invested),
                                        noun
                                    )
                                }
                            />
                            <Kpi
                                label={`Planned this ${noun}`}
                                value={rupees(Number(current.planned))}
                                note={
                                    pctOfPlan !== null
                                        ? `${pctOfPlan}% done so far`
                                        : 'No target covers this period'
                                }
                                tone={
                                    pctOfPlan === null
                                        ? undefined
                                        : pctOfPlan >= 100
                                          ? 'good'
                                          : undefined
                                }
                            />
                            <Kpi
                                label={`Spent from allowances this ${noun}`}
                                value={rupees(Number(current.spent))}
                                note={
                                    previous &&
                                    changeNote(
                                        Number(current.spent),
                                        Number(previous.spent),
                                        noun
                                    )
                                }
                            />
                            <Kpi
                                label={`Total goals in ${kpi.year.label}`}
                                value={rupees(kpi.year.planned)}
                                note={
                                    kpi.year.planned > 0
                                        ? `${rupees(kpi.year.done)} in so far, ${Math.round((kpi.year.done / kpi.year.planned) * 100)}%`
                                        : 'No targets this year'
                                }
                            />
                        </dl>
                    )}

                    <div className={MAIN_COLUMN}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <ul
                                className="flex flex-wrap gap-x-4 gap-y-1.5"
                                aria-label="Legend"
                            >
                                {seriesKeys.map((s) => (
                                    <li
                                        key={s.key}
                                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                                    >
                                        <span
                                            aria-hidden
                                            className="size-2.5 rounded-sm"
                                            style={{ background: s.color }}
                                        />
                                        {s.name}
                                    </li>
                                ))}
                            </ul>
                            <Segmented
                                label="Show as"
                                value={view}
                                onChange={setView}
                                options={[
                                    { value: 'chart', label: 'Over time' },
                                    { value: 'goals', label: 'By goal' },
                                    { value: 'table', label: 'Table' },
                                ]}
                            />
                        </div>

                        {view === 'chart' ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={data} barCategoryGap="22%">
                                    <CartesianGrid
                                        stroke="hsl(var(--border))"
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="short"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={axisTick}
                                        tickMargin={10}
                                        minTickGap={8}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={axisTick}
                                        tickFormatter={compact}
                                        width={56}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                        content={({
                                            active,
                                            payload,
                                            label,
                                        }) => (
                                            <ChartTooltip
                                                active={active}
                                                payload={payload as never}
                                                label={label as string}
                                                rows={[
                                                    ...seriesKeys,
                                                    {
                                                        key: 'total',
                                                        name: 'Total',
                                                        color: 'transparent',
                                                    },
                                                ]}
                                            />
                                        )}
                                    />
                                    {seriesKeys.map((s) => (
                                        <Bar
                                            key={s.key}
                                            dataKey={s.key}
                                            name={s.name}
                                            stackId="goals"
                                            fill={s.color}
                                            // 2px card-coloured gap between stacked segments.
                                            stroke="hsl(var(--card))"
                                            strokeWidth={2}
                                            maxBarSize={44}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        ) : view === 'goals' ? (
                            <GoalBreakdown rows={byGoal} />
                        ) : (
                            <BreakdownTable
                                data={data}
                                seriesKeys={seriesKeys}
                                noun={noun}
                            />
                        )}
                    </div>
                </div>
            )}
        </Card>
    )
}

type GoalTotals = {
    id: string
    name: string
    kind: Goal['kind']
    color: string
    total: number
    count: number
    planned: number
}

// One row per goal for the selected range: amount, a bar on a shared scale
// (no background track) with a tick where the plan sits, and % of plan.
const GoalBreakdown = ({ rows }: { rows: GoalTotals[] }) => {
    const scale = Math.max(...rows.map((r) => Math.max(r.total, r.planned)), 1)
    const grand = rows.reduce((sum, r) => sum + r.total, 0)

    return (
        <ul className="divide-y">
            {rows.map((r) => {
                const pctOfPlan =
                    r.planned > 0
                        ? Math.round((r.total / r.planned) * 100)
                        : null
                const over =
                    r.kind === 'allowance' &&
                    pctOfPlan !== null &&
                    pctOfPlan > 100
                return (
                    <li
                        key={r.id}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-3 first:pt-0 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_9rem]"
                    >
                        <div className="flex min-w-0 items-center gap-2.5">
                            <span
                                aria-hidden
                                className="size-2.5 shrink-0 rounded-sm"
                                style={{ background: r.color }}
                            />
                            <div className="min-w-0">
                                <Link
                                    href={`/goals/${r.id}`}
                                    className="block truncate text-sm font-medium hover:underline"
                                >
                                    {r.name}
                                </Link>
                                <p className="text-xs text-muted-foreground">
                                    {KIND_COPY[r.kind].label}
                                    {grand > 0 &&
                                        `, ${Math.round((r.total / grand) * 100)}% of all`}
                                </p>
                            </div>
                        </div>

                        <div className="relative order-last col-span-2 h-2 sm:order-none sm:col-span-1">
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: `${(r.total / scale) * 100}%`,
                                    background: r.color,
                                }}
                            />
                            {r.planned > 0 && (
                                <span
                                    aria-hidden
                                    title="Planned"
                                    className="absolute -top-1 h-4 w-0.5 rounded-full bg-foreground/50"
                                    style={{
                                        left: `calc(${(r.planned / scale) * 100}% - 1px)`,
                                    }}
                                />
                            )}
                        </div>

                        <div className="text-right">
                            <p className="font-mono text-sm font-semibold tabular-nums">
                                {rupees(r.total)}
                            </p>
                            <p
                                className={cn(
                                    'text-xs tabular-nums text-muted-foreground',
                                    over && 'text-expense'
                                )}
                            >
                                {pctOfPlan !== null
                                    ? `${pctOfPlan}% of ${rupees(r.planned)}`
                                    : `${r.count} ${r.count === 1 ? 'entry' : 'entries'}`}
                            </p>
                        </div>
                    </li>
                )
            })}
            <li className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
                <span>
                    The tick on each bar marks the planned amount for this
                    range.
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                    {rupees(grand)}
                </span>
            </li>
        </ul>
    )
}

const BreakdownTable = ({
    data,
    seriesKeys,
    noun,
}: {
    data: Record<string, number | string>[]
    seriesKeys: { key: string; name: string; color: string }[]
    noun: string
}) => (
    <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                    <th className="h-10 px-4 text-left font-medium">{noun}</th>
                    {seriesKeys.map((s) => (
                        <th
                            key={s.key}
                            className="h-10 px-4 text-right font-medium"
                        >
                            <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                                <span
                                    aria-hidden
                                    className="size-2 rounded-sm"
                                    style={{ background: s.color }}
                                />
                                {s.name}
                            </span>
                        </th>
                    ))}
                    <th className="h-10 px-4 text-right font-medium">Total</th>
                    <th className="h-10 px-4 text-right font-medium">
                        Planned
                    </th>
                </tr>
            </thead>
            <tbody>
                {[...data].reverse().map((d) => (
                    <tr key={String(d.key)} className="border-t">
                        <td className="px-4 py-2.5 font-medium">{d.label}</td>
                        {seriesKeys.map((s) => (
                            <td
                                key={s.key}
                                className="px-4 py-2.5 text-right font-mono tabular-nums text-muted-foreground"
                            >
                                {Number(d[s.key])
                                    ? rupees(Number(d[s.key]))
                                    : '-'}
                            </td>
                        ))}
                        <td className="px-4 py-2.5 text-right font-mono font-medium tabular-nums">
                            {rupees(Number(d.total))}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                            {Number(d.planned)
                                ? rupees(Number(d.planned))
                                : '-'}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)

/* ------------------------------------------------------------------ */
/* One goal: put in vs planned                                         */
/* ------------------------------------------------------------------ */

export const GoalStats = ({ goal }: { goal: Goal }) => {
    const statsQuery = useGetGoalStats(goal.id)
    const [granularity, setGranularity] = useState<Granularity>('month')
    const [range, setRange] = useState<Range>('recent')
    const [view, setView] = useState<'chart' | 'table'>('chart')

    const rows = statsQuery.data ?? []
    const buckets = useBuckets(granularity, range, rows, goal.periods)
    const copy = KIND_COPY[goal.kind]
    const doneLabel = copy.done[0].toUpperCase() + copy.done.slice(1)
    const barColor =
        goal.kind === 'allowance'
            ? 'hsl(var(--foreground))'
            : 'hsl(var(--brand))'

    const data = useMemo(() => {
        const rolled = rollUp(rows, granularity)
        let cumulative = 0
        return buckets.map((bucket: Bucket) => {
            const cell = rolled.get(bucket.key)?.get(goal.id)
            const done = cell?.total ?? 0
            cumulative += done
            const planned = plannedIn(goal.periods, bucket)
            return {
                key: bucket.key,
                label: bucket.label,
                short: bucket.short,
                done,
                planned,
                count: cell?.count ?? 0,
                cumulative,
            }
        })
    }, [rows, granularity, buckets, goal])

    if (statsQuery.isLoading) return <StatsSkeleton />

    const noun = BUCKET_NOUN[granularity]
    const active = data.filter((d) => d.done > 0)
    const average = active.length
        ? active.reduce((s, d) => s + d.done, 0) / active.length
        : 0
    const best = active.reduce<(typeof data)[0] | undefined>(
        (b, d) => (!b || d.done > b.done ? d : b),
        undefined
    )
    const current = data.find(
        (d) => d.key === bucketOf(new Date(), granularity).key
    )
    const plannedPct =
        current && current.planned > 0
            ? Math.round((current.done / current.planned) * 100)
            : null

    return (
        <Card className="space-y-5 p-4 lg:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <h3 className="text-base font-semibold">Stats</h3>
                <Controls
                    granularity={granularity}
                    setGranularity={setGranularity}
                    range={range}
                    setRange={setRange}
                />
            </div>

            {active.length === 0 ? (
                <EmptyState
                    icon={BarChart3}
                    title="Nothing logged in this range"
                    description="Pick All time, or log an entry to start the chart."
                />
            ) : (
                <div className={STATS_LAYOUT}>
                    <dl className={`${KPI_RAIL} grid-cols-3`}>
                        <Kpi
                            label={`${doneLabel} this ${noun}`}
                            value={rupees(current?.done ?? 0)}
                            note={
                                plannedPct !== null
                                    ? `${plannedPct}% of ${rupees(current?.planned ?? 0)} planned`
                                    : 'No target covers this period'
                            }
                            tone={
                                plannedPct === null
                                    ? undefined
                                    : goal.kind === 'allowance'
                                      ? plannedPct > 100
                                          ? 'bad'
                                          : undefined
                                      : plannedPct >= 100
                                        ? 'good'
                                        : undefined
                            }
                        />
                        <Kpi
                            label={`Average per active ${noun}`}
                            value={rupees(average)}
                            note={`${active.length} ${active.length === 1 ? noun : `${noun}s`} with entries`}
                        />
                        <Kpi
                            label={`Biggest ${noun}`}
                            value={rupees(best?.done ?? 0)}
                            note={best?.label}
                        />
                    </dl>

                    <div className={MAIN_COLUMN}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <ul
                                className="flex flex-wrap gap-x-4 gap-y-1.5"
                                aria-label="Legend"
                            >
                                <li className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span
                                        aria-hidden
                                        className="size-2.5 rounded-sm"
                                        style={{ background: barColor }}
                                    />
                                    {doneLabel}
                                </li>
                                <li className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span
                                        aria-hidden
                                        className="h-0.5 w-3 bg-muted-foreground"
                                    />
                                    Planned, from the period targets
                                </li>
                            </ul>
                            <Segmented
                                label="Show as"
                                value={view}
                                onChange={setView}
                                options={[
                                    { value: 'chart', label: 'Chart' },
                                    { value: 'table', label: 'Table' },
                                ]}
                            />
                        </div>

                        {view === 'chart' ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <ComposedChart data={data} barCategoryGap="22%">
                                    <CartesianGrid
                                        stroke="hsl(var(--border))"
                                        strokeDasharray="3 3"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="short"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={axisTick}
                                        tickMargin={10}
                                        minTickGap={8}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={axisTick}
                                        tickFormatter={compact}
                                        width={56}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                        content={({
                                            active: isActive,
                                            payload,
                                            label,
                                        }) => (
                                            <ChartTooltip
                                                active={isActive}
                                                payload={payload as never}
                                                label={label as string}
                                                rows={[
                                                    {
                                                        key: 'done',
                                                        name: doneLabel,
                                                        color: barColor,
                                                    },
                                                    {
                                                        key: 'planned',
                                                        name: 'Planned',
                                                        color: 'hsl(var(--muted-foreground))',
                                                        dashed: true,
                                                    },
                                                ]}
                                            />
                                        )}
                                    />
                                    <Bar
                                        dataKey="done"
                                        name={doneLabel}
                                        fill={barColor}
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={44}
                                    />
                                    <Line
                                        dataKey="planned"
                                        name="Planned"
                                        type="linear"
                                        stroke="hsl(var(--muted-foreground))"
                                        strokeWidth={2}
                                        strokeDasharray="5 4"
                                        dot={false}
                                        activeDot={{
                                            r: 4,
                                            strokeWidth: 2,
                                            stroke: 'hsl(var(--card))',
                                        }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="overflow-x-auto rounded-md border">
                                <table className="w-full min-w-[560px] text-sm">
                                    <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                                        <tr>
                                            <th className="h-10 px-4 text-left font-medium">
                                                {noun}
                                            </th>
                                            <th className="h-10 px-4 text-right font-medium">
                                                Planned
                                            </th>
                                            <th className="h-10 px-4 text-right font-medium">
                                                {doneLabel}
                                            </th>
                                            <th className="h-10 px-4 text-right font-medium">
                                                Difference
                                            </th>
                                            <th className="h-10 px-4 text-right font-medium">
                                                Entries
                                            </th>
                                            <th className="h-10 px-4 text-right font-medium">
                                                Total in range
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...data].reverse().map((d) => {
                                            const diff = d.done - d.planned
                                            const good =
                                                goal.kind === 'allowance'
                                                    ? diff <= 0
                                                    : diff >= 0
                                            return (
                                                <tr
                                                    key={d.key}
                                                    className="border-t"
                                                >
                                                    <td className="px-4 py-2.5 font-medium">
                                                        {d.label}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                                                        {d.planned
                                                            ? rupees(d.planned)
                                                            : '-'}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-mono font-medium tabular-nums">
                                                        {d.done
                                                            ? rupees(d.done)
                                                            : '-'}
                                                    </td>
                                                    <td
                                                        className={cn(
                                                            'px-4 py-2.5 text-right font-mono tabular-nums',
                                                            d.planned
                                                                ? good
                                                                    ? 'text-income'
                                                                    : 'text-expense'
                                                                : 'text-muted-foreground'
                                                        )}
                                                    >
                                                        {d.planned
                                                            ? `${diff >= 0 ? '+' : '-'}${rupees(Math.abs(diff))}`
                                                            : '-'}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                                                        {d.count || '-'}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                                                        {rupees(d.cumulative)}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Card>
    )
}
