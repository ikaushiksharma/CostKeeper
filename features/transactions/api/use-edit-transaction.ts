import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { InferRequestType, InferResponseType } from 'hono'
import { toast } from 'sonner'

import { client } from '@/lib/hono'

type ResponseType = InferResponseType<
    (typeof client.api.transactions)[':id']['$patch']
>
type RequestType = InferRequestType<
    (typeof client.api.transactions)[':id']['$patch']
>['json']

export const useEditTransaction = (id?: string) => {
    const queryClient = useQueryClient()

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async (json) => {
            const response = await client.api.transactions[':id'].$patch({
                json,
                param: { id },
            })

            return await response.json()
        },
        onSuccess: () => {
            toast.success('Transaction updated.')
            queryClient.invalidateQueries({ queryKey: ['transaction', { id }] })
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            queryClient.invalidateQueries({ queryKey: ['summary'] })
            queryClient.invalidateQueries({ queryKey: ['goals'] })
            queryClient.invalidateQueries({ queryKey: ['goal'] })
            queryClient.invalidateQueries({ queryKey: ['goal-contributions'] })
            queryClient.invalidateQueries({ queryKey: ['goal-stats'] })
        },
        onError: () => {
            toast.error('Failed to edit transaction.')
        },
    })

    return mutation
}
