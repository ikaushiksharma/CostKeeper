import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { client } from '@/lib/hono'
import { ensureOk, invalidateGoalData } from './shared'

export const useDeleteGoal = (id?: string) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async () => {
            const response = await client.api.goals[':id'].$delete({
                param: { id: id as string },
            })
            await ensureOk(response, 'Failed to delete goal.')
            return response.json()
        },
        onSuccess: () => {
            toast.success(
                'Goal deleted. Its transactions are still in your ledger.'
            )
            invalidateGoalData(queryClient)
        },
        onError: (error) => toast.error(error.message),
    })
}
