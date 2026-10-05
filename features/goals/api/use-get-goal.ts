import { useQuery } from '@tanstack/react-query'

import { client } from '@/lib/hono'
import { toGoal } from './shared'

export const useGetGoal = (id?: string) => {
    return useQuery({
        enabled: !!id,
        queryKey: ['goal', { id }],
        queryFn: async () => {
            const response = await client.api.goals[':id'].$get({
                param: { id: id as string },
            })
            if (!response.ok) throw new Error('Failed to fetch goal.')
            const { data } = await response.json()
            return toGoal(data)
        },
    })
}
