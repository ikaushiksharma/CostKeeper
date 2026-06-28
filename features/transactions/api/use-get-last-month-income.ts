import { useQuery } from '@tanstack/react-query'

import { client } from '@/lib/hono'
import { convertAmountFromMilliunits } from '@/lib/utils'

export const useGetLastMonthIncome = (enabled: boolean = false) => {
    const query = useQuery({
        queryKey: ['last-month-income'],
        enabled,
        queryFn: async () => {
            const response =
                await client.api.transactions['last-month-income']['$get']()

            if (!response.ok) {
                throw new Error('Failed to fetch last month income.')
            }

            const { data } = await response.json()

            return data.map((t) => ({
                ...t,
                amount: convertAmountFromMilliunits(t.amount),
            }))
        },
    })

    return query
}
