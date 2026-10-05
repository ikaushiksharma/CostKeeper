import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type EmptyStateProps = {
    icon: LucideIcon
    title: string
    description: string
    action?: ReactNode
    className?: string
}

export const EmptyState = ({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) => (
    <div
        className={cn(
            'flex flex-col items-center justify-center gap-3 px-6 py-10 text-center',
            className
        )}
    >
        <div className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Icon className="size-5" />
        </div>
        <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="max-w-[36ch] text-sm text-muted-foreground">
                {description}
            </p>
        </div>
        {action}
    </div>
)
