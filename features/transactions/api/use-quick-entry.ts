import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InferRequestType, InferResponseType } from 'hono'
import { toast } from 'sonner'

import { client } from '@/lib/hono'

type ResponseType = InferResponseType<
    (typeof client.api.transactions)['quick-entry']['$post']
>
type RequestType = InferRequestType<
    (typeof client.api.transactions)['quick-entry']['$post']
>['json']

export const useQuickEntry = () => {
    const queryClient = useQueryClient()

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async (json) => {
            const response = await client.api.transactions['quick-entry'].$post(
                { json }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(
                    (errorData as { error?: string }).error ||
                        'Failed to create transaction'
                )
            }

            return await response.json()
        },
        onSuccess: (data) => {
            if ('parsed' in data && data.parsed) {
                const amount = Math.abs(data.parsed.amount / 1000)
                const isExpense = data.parsed.amount < 0
                toast.success(
                    `${isExpense ? 'Expense' : 'Income'} of Rs ${amount.toFixed(2)} added to ${data.parsed.accountName}`
                )
            } else {
                toast.success('Transaction created.')
            }
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            queryClient.invalidateQueries({ queryKey: ['summary'] })
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to create transaction.')
        },
    })

    return mutation
}
