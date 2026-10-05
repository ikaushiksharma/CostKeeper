import {
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
} from 'recharts'

type RadarVariantProps = {
    data?: {
        name: string
        value: number
    }[]
}

export const RadarVariant = ({ data }: RadarVariantProps) => {
    return (
        <ResponsiveContainer width="100%" height={320}>
            <RadarChart cx="50%" cy="50%" outerRadius="60%" data={data}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                    dataKey="name"
                    tick={{
                        fill: 'hsl(var(--muted-foreground))',
                        fontSize: 12,
                    }}
                />
                <PolarRadiusAxis
                    tick={{
                        fill: 'hsl(var(--muted-foreground))',
                        fontSize: 11,
                    }}
                    axisLine={false}
                />
                <Radar
                    dataKey="value"
                    stroke="hsl(var(--brand))"
                    fill="hsl(var(--brand))"
                    fillOpacity={0.25}
                />
            </RadarChart>
        </ResponsiveContainer>
    )
}
