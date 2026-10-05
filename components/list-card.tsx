import type { ReactNode } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type ListCardProps = {
    title: string
    count?: number
    actions?: ReactNode
    children: ReactNode
}

// Shared shell for the table pages: title + count on the left, actions right.
export const ListCard = ({
    title,
    count,
    actions,
    children,
}: ListCardProps) => (
    <Card>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between lg:px-6 lg:pt-5">
            <h2 className="flex items-baseline gap-2 text-base font-semibold">
                {title}
                {count !== undefined && (
                    <span className="text-sm font-normal text-muted-foreground tabular-nums">
                        {count}
                    </span>
                )}
            </h2>
            {actions && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {actions}
                </div>
            )}
        </div>
        <CardContent className="p-4 pt-0 lg:px-6 lg:pb-5">
            {children}
        </CardContent>
    </Card>
)

export const ListCardSkeleton = ({ rows = 8 }: { rows?: number }) => (
    <Card>
        <div className="flex items-center justify-between p-4 lg:px-6 lg:pt-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-4 p-4 pt-0 lg:px-6 lg:pb-5">
            <Skeleton className="h-10 w-full sm:max-w-xs" />
            <div className="overflow-hidden rounded-md border">
                <Skeleton className="h-10 w-full rounded-none" />
                {Array.from({ length: rows }).map((_, i) => (
                    <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length loading placeholders with no identity.
                        key={i}
                        className="flex items-center gap-4 border-t px-4 py-3"
                    >
                        <Skeleton className="size-4" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 flex-1 max-w-48" />
                        <Skeleton className="ml-auto h-4 w-20" />
                    </div>
                ))}
            </div>
        </div>
    </Card>
)
