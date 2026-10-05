import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { InferRequestType } from 'hono'
import { toast } from 'sonner'

import { client } from '@/lib/hono'
import { ensureOk, invalidateGoalData } from './shared'

type RequestType = InferRequestType<
    (typeof client.api.goals)[':id']['periods']['$post']
>['json']

// Creates a period, or updates one when `periodId` is given.
export const useSavePeriod = (goalId?: string, periodId?: string) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (json: RequestType) => {
            const response = periodId
                ? await client.api.goals[':id'].periods[':periodId'].$patch({
                      param: { id: goalId as string, periodId },
                      json,
                  })
                : await client.api.goals[':id'].periods.$post({
                      param: { id: goalId as string },
                      json,
                  })
            await ensureOk(response, 'Failed to save period.')
            return response.json()
        },
        onSuccess: () => {
            toast.success(periodId ? 'Period updated.' : 'Period added.')
            invalidateGoalData(queryClient)
        },
        onError: (error) => toast.error(error.message),
    })
}

export const useDeletePeriod = (goalId?: string, periodId?: string) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async () => {
            const response = await client.api.goals[':id'].periods[
                ':periodId'
            ].$delete({
                param: { id: goalId as string, periodId: periodId as string },
            })
            await ensureOk(response, 'Failed to delete period.')
            return response.json()
        },
        onSuccess: () => {
            toast.success('Period deleted.')
            invalidateGoalData(queryClient)
        },
        onError: (error) => toast.error(error.message),
    })
}
