'use client'

import { useGetSummary } from '@/features/summary/api/use-get-summary'

import { Chart, ChartLoading } from './chart'
import { SpendingPie, SpendingPieLoading } from './spending-pie'

export const DataCharts = () => {
    const { data, isLoading } = useGetSummary()

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
            <div className="lg:col-span-3 xl:col-span-4">
                {isLoading ? <ChartLoading /> : <Chart data={data?.days} />}
            </div>
            <div className="lg:col-span-3 xl:col-span-2">
                {isLoading ? (
                    <SpendingPieLoading />
                ) : (
                    <SpendingPie data={data?.categories} />
                )}
            </div>
        </div>
    )
}
