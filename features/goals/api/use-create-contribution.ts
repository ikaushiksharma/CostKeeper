import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { InferRequestType } from 'hono'
import { toast } from 'sonner'

import { client } from '@/lib/hono'
import { ensureOk, invalidateGoalData } from './shared'

type RequestType = InferRequestType<
    (typeof client.api.goals)[':id']['contributions']['$post']
>['json']

export const useCreateContribution = (goalId?: string) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (json: RequestType) => {
            const response = await client.api.goals[':id'].contributions.$post({
                param: { id: goalId as string },
                json,
            })
            await ensureOk(response, 'Failed to log contribution.')
            return response.json()
        },
        onSuccess: () => {
            toast.success('Contribution logged.')
            invalidateGoalData(queryClient)
        },
        onError: (error) => toast.error(error.message),
    })
}
