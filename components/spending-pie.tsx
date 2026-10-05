import { PieChart, Radar, Shapes, Target } from 'lucide-react'
import { useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from './empty-state'
import { PieVariant } from './pie-variant'
import { RadarVariant } from './radar-variant'
import { RadialVariant } from './radial-variant'
import { Segmented } from './segmented'

type SpendingPieProps = {
    data?: {
        name: string
        value: number
    }[]
}

type ChartType = 'pie' | 'radar' | 'radial'

const chartOptions = [
    { value: 'pie' as const, label: 'Donut chart', icon: PieChart },
    { value: 'radar' as const, label: 'Radar chart', icon: Radar },
    { value: 'radial' as const, label: 'Radial chart', icon: Target },
]

export const SpendingPie = ({ data = [] }: SpendingPieProps) => {
    const [chartType, setChartType] = useState<ChartType>('pie')

    return (
        <Card className="h-full">
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
                <div className="space-y-2">
                    <CardTitle>Spending by category</CardTitle>
                    <p className="text-xs text-muted-foreground">
                        Top four, the rest grouped as Other
                    </p>
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
                        icon={Shapes}
                        title="No spending yet"
                        description="Categorised expenses in this period will show up here."
                        className="h-[320px]"
                    />
                ) : (
                    <>
                        {chartType === 'pie' && <PieVariant data={data} />}
                        {chartType === 'radar' && <RadarVariant data={data} />}
                        {chartType === 'radial' && (
                            <RadialVariant data={data} />
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}

export const SpendingPieLoading = () => {
    return (
        <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-9 w-28" />
            </CardHeader>
            <CardContent className="flex h-[352px] items-center justify-center">
                <Skeleton className="size-48 rounded-full" />
            </CardContent>
        </Card>
    )
}
