import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { InferRequestType } from 'hono'
import { toast } from 'sonner'

import { client } from '@/lib/hono'
import { ensureOk, invalidateGoalData } from './shared'

type RequestType = InferRequestType<typeof client.api.goals.$post>['json']

export const useCreateGoal = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (json: RequestType) => {
            const response = await client.api.goals.$post({ json })
            await ensureOk(response, 'Failed to create goal.')
            const { data } = (await response.json()) as { data: { id: string } }
            return data
        },
        onSuccess: () => {
            toast.success('Goal created.')
            invalidateGoalData(queryClient)
            queryClient.invalidateQueries({ queryKey: ['categories'] })
        },
        onError: (error) => toast.error(error.message),
    })
}
