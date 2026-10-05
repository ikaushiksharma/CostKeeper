import { format } from 'date-fns'
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
} from 'recharts'

import { CustomTooltip } from './custom-tooltip'

type AreaVariantProps = {
    data: {
        date: string
        income: number
        expenses: number
    }[]
}

export const AreaVariant = ({ data }: AreaVariantProps) => {
    return (
        <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data}>
                <CartesianGrid
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 3"
                    vertical={false}
                />
                <defs>
                    <linearGradient id="ck-income" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="2%"
                            stopColor="hsl(var(--income))"
                            stopOpacity={0.25}
                        />
                        <stop
                            offset="98%"
                            stopColor="hsl(var(--income))"
                            stopOpacity={0}
                        />
                    </linearGradient>

                    <linearGradient
                        id="ck-expenses"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="2%"
                            stopColor="hsl(var(--expense))"
                            stopOpacity={0.25}
                        />
                        <stop
                            offset="98%"
                            stopColor="hsl(var(--expense))"
                            stopOpacity={0}
                        />
                    </linearGradient>
                </defs>

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

                <Area
                    type="monotone"
                    dataKey="income"
                    stackId="income"
                    strokeWidth={2}
                    stroke="hsl(var(--income))"
                    fill="url(#ck-income)"
                />

                <Area
                    type="monotone"
                    dataKey="expenses"
                    stackId="expenses"
                    strokeWidth={2}
                    stroke="hsl(var(--expense))"
                    fill="url(#ck-expenses)"
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}
