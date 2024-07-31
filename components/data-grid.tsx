'use client'

import { useSearchParams } from 'next/navigation'
import { FaPiggyBank } from 'react-icons/fa'
import { FaArrowTrendUp, FaArrowTrendDown } from 'react-icons/fa6'
import { useGetSummary } from '@/features/summary/api/use-get-summary'
import { formatDateRange } from '@/lib/utils'

import { DataCard, DataCardLoading } from './data-card'

export const DataGrid = () => {
    const { data, isLoading } = useGetSummary()
    const searchParams = useSearchParams()
    const to = searchParams.get('to') || undefined
    const from = searchParams.get('from') || undefined

    const dateRangeLabel = formatDateRange({ to, from })
    if (isLoading)
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-2 mb-8">
                <DataCardLoading />
                <DataCardLoading />
                <DataCardLoading />
            </div>
        )
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-2 mb-8">
            <DataCard
                title="Remaining"
                value={data?.remainingAmount}
                icon={FaPiggyBank}
                variant="default"
                dateRange={dateRangeLabel}
            />
            <DataCard
                title="Income"
                value={data?.incomeAmount}
                icon={FaArrowTrendUp}
                variant="success"
                dateRange={dateRangeLabel}
            />

            <DataCard
                title="Expenses"
                value={data?.expensesAmount}
                icon={FaArrowTrendDown}
                variant="danger"
                dateRange={dateRangeLabel}
            />
        </div>
    )
}
