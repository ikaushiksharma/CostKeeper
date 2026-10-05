import { AreaChart, BarChart3, LineChart, Plus, TrendingUp } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useNewTransaction } from '@/features/transactions/hooks/use-new-transaction'
import { AreaVariant } from './area-variant'
import { BarVariant } from './bar-variant'
import { EmptyState } from './empty-state'
import { LineVariant } from './line-variant'
import { Segmented } from './segmented'

type ChartProps = {
    data?: {
        date: string
        income: number
        expenses: number
    }[]
}

type ChartType = 'area' | 'bar' | 'line'

const chartOptions = [
    { value: 'area' as const, label: 'Area chart', icon: AreaChart },
    { value: 'line' as const, label: 'Line chart', icon: LineChart },
    { value: 'bar' as const, label: 'Bar chart', icon: BarChart3 },
]

export const ChartLegend = () => (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-income" aria-hidden />
            Income
        </span>
        <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-expense" aria-hidden />
            Expenses
        </span>
    </div>
)

export const Chart = ({ data = [] }: ChartProps) => {
    const [chartType, setChartType] = useState<ChartType>('area')
    const newTransaction = useNewTransaction()

    return (
        <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
                <div className="space-y-2">
                    <CardTitle>Cash flow</CardTitle>
                    <ChartLegend />
                </div>
                <Segmented
                    label="Chart type"
                    value={chartType}
                    onChange={setChartType}
                    options={chartOptions}
                    iconOnly
                />
            </CardHeader>

            <CardContent>
                {data.length === 0 ? (
                    <EmptyState
                        icon={TrendingUp}
                        title="No activity in this period"
                        description="Add a transaction or pick a wider date range to see your cash flow."
                        className="h-[320px]"
                        action={
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={newTransaction.onOpen}
                            >
                                <Plus className="size-4" /> Add transaction
                            </Button>
                        }
                    />
                ) : (
                    <>
                        {chartType === 'area' && <AreaVariant data={data} />}
                        {chartType === 'bar' && <BarVariant data={data} />}
                        {chartType === 'line' && <LineVariant data={data} />}
                    </>
                )}
            </CardContent>
        </Card>
    )
}

export const ChartLoading = () => {
    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-9 w-28" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[320px] w-full" />
            </CardContent>
        </Card>
    )
}
