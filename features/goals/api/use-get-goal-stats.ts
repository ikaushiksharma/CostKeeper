import { useQuery } from '@tanstack/react-query'

import { client } from '@/lib/hono'
import { convertAmountFromMilliunits } from '@/lib/utils'

// Monthly contribution totals per goal; one goal when `goalId` is given.
export const useGetGoalStats = (goalId?: string) => {
    return useQuery({
        queryKey: ['goal-stats', { goalId }],
        queryFn: async () => {
            const response = await client.api.goals.stats.$get({
                query: goalId ? { goalId } : {},
            })
            if (!response.ok) throw new Error('Failed to fetch goal stats.')
            const { data } = await response.json()
            return data.map((row) => ({
                ...row,
                total: convertAmountFromMilliunits(row.total),
            }))
        },
    })
}
