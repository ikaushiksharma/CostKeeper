import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { InferRequestType } from 'hono'
import { toast } from 'sonner'

import { client } from '@/lib/hono'
import { ensureOk, invalidateGoalData } from './shared'

type RequestType = InferRequestType<
    (typeof client.api.goals)[':id']['$patch']
>['json']

export const useEditGoal = (id?: string) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (json: RequestType) => {
            const response = await client.api.goals[':id'].$patch({
                param: { id: id as string },
                json,
            })
            await ensureOk(response, 'Failed to update goal.')
            return response.json()
        },
        onSuccess: (_data, variables) => {
            toast.success(
                variables.status === 'archived'
                    ? 'Goal archived.'
                    : variables.status === 'paused'
                      ? 'Goal paused.'
                      : variables.status === 'active' &&
                          Object.keys(variables).length === 1
                        ? 'Goal resumed.'
                        : 'Goal updated.'
            )
            invalidateGoalData(queryClient)
        },
        onError: (error) => toast.error(error.message),
    })
}
