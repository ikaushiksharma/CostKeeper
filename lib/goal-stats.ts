import {
    addMonths,
    differenceInCalendarDays,
    format,
    max as maxDate,
    min as minDate,
    startOfDay,
    startOfMonth,
} from 'date-fns'

// Pure helpers for goal stats: bucket months into month / quarter / half-year
// / year, and spread each period's target across the buckets it overlaps.

export type Granularity = 'month' | 'quarter' | 'half_year' | 'year'

export const GRANULARITY_LABEL: Record<Granularity, string> = {
    month: 'Monthly',
    quarter: 'Quarterly',
    half_year: 'Half-yearly',
    year: 'Yearly',
}

export const BUCKET_NOUN: Record<Granularity, string> = {
    month: 'month',
    quarter: 'quarter',
    half_year: 'half',
    year: 'year',
}

// How many buckets to show by default.
export const DEFAULT_SPAN: Record<Granularity, number> = {
    month: 12,
    quarter: 8,
    half_year: 6,
    year: 5,
}

const MONTHS: Record<Granularity, number> = {
    month: 1,
    quarter: 3,
    half_year: 6,
    year: 12,
}

export type Bucket = {
    key: string
    label: string
    // Short label for chart axes.
    short: string
    start: Date
    // Inclusive last day.
    end: Date
}

export function bucketOf(date: Date, granularity: Granularity): Bucket {
    const size = MONTHS[granularity]
    const year = date.getFullYear()
    const index = Math.floor(date.getMonth() / size)
    const start = new Date(year, index * size, 1)
    const end = new Date(year, index * size + size, 0)
    switch (granularity) {
        case 'month':
            return {
                key: format(start, 'yyyy-MM'),
                label: format(start, 'MMM yyyy'),
                short: format(start, 'MMM yy'),
                start,
                end,
            }
        case 'quarter':
            return {
                key: `${year}-Q${index + 1}`,
                label: `Q${index + 1} ${year}`,
                short: `Q${index + 1} ${String(year).slice(2)}`,
                start,
                end,
            }
        case 'half_year':
            return {
                key: `${year}-H${index + 1}`,
                label: `H${index + 1} ${year}`,
                short: `H${index + 1} ${String(year).slice(2)}`,
                start,
                end,
            }
        default:
            return {
                key: `${year}`,
                label: `${year}`,
                short: `${year}`,
                start,
                end,
            }
    }
}

// Consecutive buckets from the one containing `from` to the one containing `to`.
export function bucketRange(
    from: Date,
    to: Date,
    granularity: Granularity
): Bucket[] {
    const buckets: Bucket[] = []
    let cursor = bucketOf(from, granularity).start
    const last = bucketOf(to, granularity).key
    for (let guard = 0; guard < 600; guard++) {
        const bucket = bucketOf(cursor, granularity)
        buckets.push(bucket)
        if (bucket.key === last) break
        cursor = addMonths(bucket.start, MONTHS[granularity])
    }
    return buckets
}

export type MonthRow = {
    goalId: string
    month: string
    total: number
    count: number
}

// Roll monthly rows ('yyyy-MM') up into bucket -> goal -> {total, count}.
export function rollUp(rows: MonthRow[], granularity: Granularity) {
    const out = new Map<string, Map<string, { total: number; count: number }>>()
    for (const row of rows) {
        const [y, m] = row.month.split('-').map(Number)
        const key = bucketOf(new Date(y, m - 1, 1), granularity).key
        const byGoal = out.get(key) ?? new Map()
        const cell = byGoal.get(row.goalId) ?? { total: 0, count: 0 }
        cell.total += row.total
        cell.count += row.count
        byGoal.set(row.goalId, cell)
        out.set(key, byGoal)
    }
    return out
}

type PlanPeriod = { startsOn: Date; endsOn: Date; targetAmount: number }

// Each period's target spread evenly over its days, summed for the bucket.
// Carry-over is left out: it corrects a total, it is not new planned money.
export function plannedIn(periods: PlanPeriod[], bucket: Bucket): number {
    let planned = 0
    for (const p of periods) {
        const start = maxDate([startOfDay(p.startsOn), bucket.start])
        const end = minDate([startOfDay(p.endsOn), bucket.end])
        const overlap = differenceInCalendarDays(end, start) + 1
        if (overlap <= 0) continue
        const days = differenceInCalendarDays(p.endsOn, p.startsOn) + 1
        planned += (p.targetAmount * overlap) / days
    }
    return planned
}

// Earliest month across rows and periods, for "all time" ranges.
export function earliest(rows: MonthRow[], periods: PlanPeriod[]): Date {
    const dates = [
        ...rows.map((r) => {
            const [y, m] = r.month.split('-').map(Number)
            return new Date(y, m - 1, 1)
        }),
        ...periods.map((p) => startOfMonth(p.startsOn)),
    ]
    return dates.length ? minDate(dates) : startOfMonth(new Date())
}
