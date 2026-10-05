import { useQuery } from '@tanstack/react-query'

import { client } from '@/lib/hono'
import { toGoal } from './shared'

export type GoalStatusFilter = 'active' | 'paused' | 'archived' | 'all'

export const useGetGoals = (status: GoalStatusFilter = 'active') => {
    return useQuery({
        queryKey: ['goals', { status }],
        queryFn: async () => {
            const response = await client.api.goals.$get({ query: { status } })
            if (!response.ok) throw new Error('Failed to fetch goals.')
            const { data } = await response.json()
            return data.map(toGoal)
        },
    })
}
