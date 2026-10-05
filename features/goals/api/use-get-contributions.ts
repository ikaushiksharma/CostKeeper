import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

import { client } from '@/lib/hono'
import { convertAmountFromMilliunits } from '@/lib/utils'

export const useGetContributions = (
    goalId: string | undefined,
    range?: { startsOn: Date; endsOn: Date }
) => {
    const from = range ? format(range.startsOn, 'yyyy-MM-dd') : undefined
    const to = range ? format(range.endsOn, 'yyyy-MM-dd') : undefined

    return useQuery({
        enabled: !!goalId,
        queryKey: ['goal-contributions', { goalId, from, to }],
        queryFn: async () => {
            const response = await client.api.goals[':id'].contributions.$get({
                param: { id: goalId as string },
                query: { from, to },
            })
            if (!response.ok) throw new Error('Failed to fetch contributions.')
            const { data } = await response.json()
            return data.map((row) => ({
                ...row,
                // Shown as a positive amount put toward the goal.
                amount: Math.abs(convertAmountFromMilliunits(row.amount)),
            }))
        },
    })
}
