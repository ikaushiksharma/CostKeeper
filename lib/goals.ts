import {
    addDays,
    differenceInCalendarDays,
    endOfMonth,
    format,
    isSameDay,
    startOfDay,
    startOfMonth,
} from 'date-fns'

// Pure goal math shared by the API and the UI. Amounts are in whichever unit
// the caller passes (rupees in the UI, milliunits on the server); every
// function here is unit-agnostic.

// Transactions are stored as UTC instants; goal periods are calendar days in
// the app's time zone (the app is India-only today).
export const APP_TIME_ZONE = 'Asia/Kolkata'

export type GoalKind = 'save' | 'payoff' | 'allowance'
export type GoalCadence = 'month' | 'quarter' | 'half_year' | 'year' | 'custom'
export type GoalCarry = 'none' | 'surplus' | 'shortfall' | 'both'
export type GoalStatus = 'active' | 'paused' | 'archived'

export type GoalHealth =
    | 'upcoming'
    | 'achieved'
    | 'ahead'
    | 'on_track'
    | 'behind'
    | 'missed'
    | 'within'
    | 'fast'
    | 'exceeded'

export const KIND_COPY: Record<
    GoalKind,
    {
        label: string
        description: string
        done: string
        remaining: string
        over: string
    }
> = {
    save: {
        label: 'Save up',
        description: 'Build toward an amount, like an SIP or a down payment.',
        done: 'saved',
        remaining: 'to go',
        over: 'ahead',
    },
    payoff: {
        label: 'Pay off',
        description: 'Clear a loan or a debt by a date.',
        done: 'paid',
        remaining: 'left to pay',
        over: 'overpaid',
    },
    allowance: {
        label: 'Allowance',
        description: 'A spending cap for trips, gifts or fun.',
        done: 'spent',
        remaining: 'left to spend',
        over: 'over',
    },
}

export const CADENCE_LABEL: Record<GoalCadence, string> = {
    month: 'Every month',
    quarter: 'Every quarter',
    half_year: 'Every half year',
    year: 'Every year',
    custom: 'Custom dates',
}

export const CARRY_LABEL: Record<GoalCarry, string> = {
    both: 'Carry shortfall and surplus',
    shortfall: 'Carry only the shortfall',
    surplus: 'Carry only the surplus',
    none: 'Start fresh each period',
}

export const DEFAULT_CARRY: Record<GoalKind, GoalCarry> = {
    save: 'both',
    payoff: 'shortfall',
    allowance: 'none',
}

export const HEALTH_COPY: Record<
    GoalHealth,
    { label: string; tone: 'good' | 'neutral' | 'bad' }
> = {
    upcoming: { label: 'Not started', tone: 'neutral' },
    achieved: { label: 'Achieved', tone: 'good' },
    ahead: { label: 'Ahead', tone: 'good' },
    on_track: { label: 'On track', tone: 'neutral' },
    behind: { label: 'Behind', tone: 'bad' },
    missed: { label: 'Missed', tone: 'bad' },
    within: { label: 'Within budget', tone: 'good' },
    fast: { label: 'Spending fast', tone: 'bad' },
    exceeded: { label: 'Over budget', tone: 'bad' },
}

export type PeriodInput = {
    startsOn: Date
    endsOn: Date
    targetAmount: number
    carryIn: number
    done: number
}

export type PeriodProgress = {
    required: number
    done: number
    remaining: number
    // 0..1+, share of `required` done; may exceed 1.
    ratio: number
    // What should be done by today if progress were linear.
    expected: number
    health: GoalHealth
    daysLeft: number
    totalDays: number
    isCurrent: boolean
    isPast: boolean
}

export function periodProgress(
    kind: GoalKind,
    period: PeriodInput,
    now: Date = new Date()
): PeriodProgress {
    const start = startOfDay(period.startsOn)
    const end = startOfDay(period.endsOn)
    const today = startOfDay(now)

    const required = Math.max(period.targetAmount + period.carryIn, 0)
    const done = period.done
    const remaining = required - done
    const ratio = required > 0 ? done / required : done > 0 ? 1 : 0

    const totalDays = differenceInCalendarDays(end, start) + 1
    const elapsedDays = Math.min(
        Math.max(differenceInCalendarDays(today, start) + 1, 0),
        totalDays
    )
    const daysLeft = Math.max(differenceInCalendarDays(end, today), 0)
    const isPast = today > end
    const isCurrent = today >= start && !isPast
    const expected = required * (elapsedDays / totalDays)
    // Small slack so day one of a period does not read as "behind".
    const slack = required * 0.05

    let health: GoalHealth
    if (kind === 'allowance') {
        if (done > required) health = 'exceeded'
        else if (today < start) health = 'upcoming'
        else if (isPast) health = 'within'
        else if (done > expected * 1.1 + slack) health = 'fast'
        else health = 'within'
    } else if (required > 0 && done >= required) {
        health = 'achieved'
    } else if (today < start) {
        health = 'upcoming'
    } else if (isPast) {
        health = 'missed'
    } else if (done >= expected * 1.1 + slack) {
        health = 'ahead'
    } else if (done >= expected * 0.9 - slack) {
        health = 'on_track'
    } else {
        health = 'behind'
    }

    return {
        required,
        done,
        remaining,
        ratio,
        expected,
        health,
        daysLeft,
        totalDays,
        isCurrent,
        isPast,
    }
}

// The period a goal is "on": the one containing today, else the latest one
// that has started, else the earliest upcoming one.
export function pickCurrentPeriod<T extends { startsOn: Date; endsOn: Date }>(
    periods: T[],
    now: Date = new Date()
): T | undefined {
    const today = startOfDay(now)
    const sorted = [...periods].sort(
        (a, b) => a.startsOn.getTime() - b.startsOn.getTime()
    )
    return (
        sorted.find(
            (p) =>
                startOfDay(p.startsOn) <= today && startOfDay(p.endsOn) >= today
        ) ??
        [...sorted].reverse().find((p) => startOfDay(p.startsOn) <= today) ??
        sorted[0]
    )
}

const halfOf = (d: Date) => (d.getMonth() < 6 ? 1 : 2)
const quarterOf = (d: Date) => Math.floor(d.getMonth() / 3) + 1

// Calendar-aligned range containing `date` for a cadence.
export function cadenceRange(
    cadence: GoalCadence,
    date: Date = new Date()
): { startsOn: Date; endsOn: Date } {
    const d = startOfDay(date)
    const year = d.getFullYear()
    switch (cadence) {
        case 'month':
            return {
                startsOn: startOfMonth(d),
                endsOn: startOfDay(endOfMonth(d)),
            }
        case 'quarter': {
            const q = quarterOf(d) - 1
            return {
                startsOn: new Date(year, q * 3, 1),
                endsOn: new Date(year, q * 3 + 3, 0),
            }
        }
        case 'year':
            return {
                startsOn: new Date(year, 0, 1),
                endsOn: new Date(year, 11, 31),
            }
        default: {
            // half_year, and the starting suggestion for custom
            const firstHalf = halfOf(d) === 1
            return firstHalf
                ? {
                      startsOn: new Date(year, 0, 1),
                      endsOn: new Date(year, 5, 30),
                  }
                : {
                      startsOn: new Date(year, 6, 1),
                      endsOn: new Date(year, 11, 31),
                  }
        }
    }
}

// The period that follows one ending on `endsOn`.
export function nextRange(
    cadence: GoalCadence,
    prev: { startsOn: Date; endsOn: Date }
): { startsOn: Date; endsOn: Date } {
    const startsOn = addDays(startOfDay(prev.endsOn), 1)
    if (cadence === 'custom') {
        const length = differenceInCalendarDays(prev.endsOn, prev.startsOn)
        return { startsOn, endsOn: addDays(startsOn, length) }
    }
    return cadenceRange(cadence, startsOn)
}

// How much of a finished period's result moves into the next one, added to
// the next period's target. delta = required - done for every kind:
// - save / payoff: positive = shortfall still owed, negative = surplus ahead.
// - allowance: positive = unspent (surplus), negative = overspent (shortfall),
//   so unspent money raises the next cap and overspending lowers it.
export function carryFrom(
    kind: GoalKind,
    policy: GoalCarry,
    progress: Pick<PeriodProgress, 'required' | 'done'>
): number {
    const delta = progress.required - progress.done
    // A debt does not disappear at a period boundary.
    const effective =
        kind === 'payoff' && policy === 'none' ? 'shortfall' : policy
    const shortfallIsPositive = kind !== 'allowance'
    const shortfall = shortfallIsPositive
        ? Math.max(delta, 0)
        : Math.min(delta, 0)
    const surplus = shortfallIsPositive
        ? Math.min(delta, 0)
        : Math.max(delta, 0)
    switch (effective) {
        case 'both':
            return delta
        case 'shortfall':
            return shortfall
        case 'surplus':
            return surplus
        default:
            return 0
    }
}

// "H1 2026", "Q3 2026", "Oct 2026", "2026", or "1 Jan - 15 Mar 2026".
export function periodLabel(range: { startsOn: Date; endsOn: Date }): string {
    const start = startOfDay(range.startsOn)
    const end = startOfDay(range.endsOn)
    const year = start.getFullYear()
    const sameYear = end.getFullYear() === year

    if (
        sameYear &&
        start.getDate() === 1 &&
        isSameDay(addDays(end, 1), startOfMonth(addDays(end, 1)))
    ) {
        const months = end.getMonth() - start.getMonth() + 1
        if (months === 12 && start.getMonth() === 0) return `${year}`
        if (months === 6 && (start.getMonth() === 0 || start.getMonth() === 6))
            return `H${halfOf(start)} ${year}`
        if (months === 3 && start.getMonth() % 3 === 0)
            return `Q${quarterOf(start)} ${year}`
        if (months === 1) return format(start, 'MMM yyyy')
    }
    return sameYear
        ? `${format(start, 'd MMM')} - ${format(end, 'd MMM yyyy')}`
        : `${format(start, 'd MMM yyyy')} - ${format(end, 'd MMM yyyy')}`
}
