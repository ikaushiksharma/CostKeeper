import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'

import { client } from '@/lib/hono'
import { convertAmountFromMilliunits } from '@/lib/utils'

export const useGetSummary = () => {
    const searchParams = useSearchParams()
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''
    const accountId = searchParams.get('accountId') || ''

    const query = useQuery({
        queryKey: ['summary', { from, to, accountId }],
        queryFn: async () => {
            const response = await client.api.summary.$get({
                query: {
                    from,
                    to,
                    accountId,
                },
            })

            if (!response.ok) throw new Error('Failed to fetch summary.')

            const { data } = await response.json()
            const incomeAmount = convertAmountFromMilliunits(data.incomeAmount)
            const expensesAmount = convertAmountFromMilliunits(
                data.expensesAmount
            )
            const remainingAmount = convertAmountFromMilliunits(
                data.remainingAmount
            )

            // Calculate percentages based on income
            const remainingPercentage =
                incomeAmount === 0 ? 0 : (remainingAmount / incomeAmount) * 100
            const expensePercentage =
                incomeAmount === 0 ? 0 : (expensesAmount / incomeAmount) * 100

            return {
                ...data,
                incomeAmount,
                expensesAmount,
                remainingAmount,
                remainingPercentage,
                expensePercentage,
                categories: data.categories.map((category) => ({
                    ...category,
                    value: convertAmountFromMilliunits(category.value),
                })),
                days: data.days.map((day) => ({
                    ...day,
                    income: convertAmountFromMilliunits(day.income),
                    expenses: convertAmountFromMilliunits(day.expenses),
                })),
            }
        },
    })

    return query
}
