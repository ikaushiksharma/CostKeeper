import type { QueryClient } from '@tanstack/react-query'
import type { InferResponseType } from 'hono'
import { parseISO } from 'date-fns'

import type { client } from '@/lib/hono'
import { convertAmountFromMilliunits } from '@/lib/utils'

type RawGoal = InferResponseType<typeof client.api.goals.$get, 200>['data'][0]

// API amounts are milliunits and period days are 'yyyy-MM-dd' strings; the UI
// works in rupees and local Dates.
export const toGoal = (goal: RawGoal) => ({
    ...goal,
    periods: goal.periods.map((period) => ({
        ...period,
        startsOn: parseISO(period.startsOn),
        endsOn: parseISO(period.endsOn),
        targetAmount: convertAmountFromMilliunits(period.targetAmount),
        carryIn: convertAmountFromMilliunits(period.carryIn),
        done: convertAmountFromMilliunits(period.done),
    })),
})

export type Goal = ReturnType<typeof toGoal>
export type GoalPeriod = Goal['periods'][0]

// Anything that changes goal money also changes the ledger views.
export const invalidateGoalData = (queryClient: QueryClient) => {
    for (const key of [
        'goals',
        'goal',
        'goal-contributions',
        'goal-stats',
        'transactions',
        'summary',
    ]) {
        queryClient.invalidateQueries({ queryKey: [key] })
    }
}

// Pull the API's error message out of a failed response.
export const ensureOk = async (response: Response, fallback: string) => {
    if (response.ok) return
    const body = (await response.json().catch(() => null)) as {
        error?: string
    } | null
    throw new Error(body?.error ?? fallback)
}
