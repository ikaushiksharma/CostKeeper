import { format } from 'date-fns'
import {
    Line,
    LineChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
} from 'recharts'

import { CustomTooltip } from '@/components/custom-tooltip'

type LineVariantProps = {
    data: {
        date: string
        income: number
        expenses: number
    }[]
}

export const LineVariant = ({ data }: LineVariantProps) => {
    return (
        <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data}>
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

                <Line
                    dot={false}
                    dataKey="income"
                    stroke="hsl(var(--income))"
                    strokeWidth={2}
                />
                <Line
                    dot={false}
                    dataKey="expenses"
                    stroke="hsl(var(--expense))"
                    strokeWidth={2}
                />
            </LineChart>
        </ResponsiveContainer>
    )
}
