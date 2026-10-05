import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
} from 'recharts'

import { CustomTooltip } from '@/components/custom-tooltip'
import { format } from 'date-fns'

type BarVariantProps = {
    data: {
        date: string
        income: number
        expenses: number
    }[]
}

export const BarVariant = ({ data }: BarVariantProps) => {
    return (
        <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
                <CartesianGrid
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 3"
                    vertical={false}
                />

                <XAxis
                    axisLine={false}
                    tickLine={false}
                    dataKey="date"
                    tickFormatter={(value) => format(value, 'dd MMM')}
                    tick={{
                        fill: 'hsl(var(--muted-foreground))',
                        fontSize: 12,
                    }}
                    tickMargin={12}
                    minTickGap={24}
                />

                <Tooltip
                    cursor={{
                        stroke: 'hsl(var(--border))',
                        fill: 'hsl(var(--muted))',
                    }}
                    content={({ active, payload }) => (
                        <CustomTooltip active={active} payload={payload} />
                    )}
                />

                <Bar
                    dataKey="income"
                    radius={[3, 3, 0, 0]}
                    fill="hsl(var(--income))"
                />
                <Bar
                    dataKey="expenses"
                    radius={[3, 3, 0, 0]}
                    fill="hsl(var(--expense))"
                />
            </BarChart>
        </ResponsiveContainer>
    )
}
