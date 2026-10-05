import type { Column } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'

type SortHeaderProps<TData> = {
    column: Column<TData>
    label: string
    align?: 'left' | 'right'
}

export function SortHeader<TData>({
    column,
    label,
    align = 'left',
}: SortHeaderProps<TData>) {
    const sorted = column.getIsSorted()
    const Icon =
        sorted === 'asc'
            ? ArrowUp
            : sorted === 'desc'
              ? ArrowDown
              : ChevronsUpDown

    return (
        <button
            type="button"
            onClick={() => column.toggleSorting(sorted === 'asc')}
            className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-md px-2 -mx-2 text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                align === 'right' && 'ml-auto flex-row-reverse',
                sorted && 'text-foreground'
            )}
            aria-label={`Sort by ${label}`}
        >
            {label}
            <Icon className="size-3.5" />
        </button>
    )
}
