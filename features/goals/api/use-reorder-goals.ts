import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { client } from '@/lib/hono'
import { ensureOk } from './shared'

// Saves a new card order. The page updates its own order immediately, so this
// only refetches once the server has it.
export const useReorderGoals = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (ids: string[]) => {
            const response = await client.api.goals.reorder.$patch({
                json: { ids },
            })
            await ensureOk(response, 'Could not save the new order.')
            return response.json()
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
        onError: (error) => toast.error(error.message),
    })
}
