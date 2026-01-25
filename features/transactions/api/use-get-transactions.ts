import { useInfiniteQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

import { client } from '@/lib/hono'
import { convertAmountFromMilliunits } from '@/lib/utils'

const PAGE_SIZE = 20

export const useGetTransactions = () => {
    const searchParams = useSearchParams()
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''
    const accountId = searchParams.get('accountId') || ''

    const query = useInfiniteQuery({
        queryKey: ['transactions', { from, to, accountId }],
        queryFn: async ({ pageParam = 0 }) => {
            const response = await client.api.transactions.$get({
                query: {
                    from,
                    to,
                    accountId,
                    limit: PAGE_SIZE.toString(),
                    offset: pageParam.toString(),
                },
            })

            if (!response.ok) throw new Error('Failed to fetch transactions.')

            const { data, nextOffset, hasMore } = await response.json()

            return {
                data: data.map((transaction) => ({
                    ...transaction,
                    amount: convertAmountFromMilliunits(transaction.amount),
                })),
                nextOffset,
                hasMore,
            }
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextOffset,
    })

    return query
}
