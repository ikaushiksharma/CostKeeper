import {
    RadialBar,
    RadialBarChart,
    Legend,
    ResponsiveContainer,
} from 'recharts'

import { formatCurrency } from '@/lib/utils'

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
]

type RadialVariantProps = {
    data: {
        name: string
        value: number
    }[]
}

export const RadialVariant = ({ data }: RadialVariantProps) => {
    return (
        <ResponsiveContainer width="100%" height={320}>
            <RadialBarChart
                cx="50%"
                cy="30%"
                barSize={10}
                innerRadius="90%"
                outerRadius="40%"
                data={data.map((item, index) => ({
                    ...item,
                    fill: COLORS[index % COLORS.length],
                }))}
            >
                <RadialBar
                    label={{
                        position: 'insideStart',
                        fill: 'hsl(var(--primary-foreground))',
                        fontSize: '12px',
                    }}
                    background
                    dataKey="value"
                />

                <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="right"
                    iconType="circle"
                    content={({ payload }) => {
                        return (
                            <ul className="flex flex-col space-y-2">
                                {payload?.map((entry) => (
                                    <li
                                        key={String(entry.value)}
                                        className="flex items-center space-x-2"
                                    >
                                        <span
                                            className="size-2 rounded-full"
                                            style={{
                                                backgroundColor: entry.color,
                                            }}
                                            aria-hidden
                                        />

                                        <div className="space-x-1">
                                            <span className="text-sm text-muted-foreground">
                                                {entry.value}
                                            </span>

                                            <span className="text-sm font-medium tabular-nums">
                                                {formatCurrency(
                                                    entry.payload?.value
                                                )}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )
                    }}
                />
            </RadialBarChart>
        </ResponsiveContainer>
    )
}
