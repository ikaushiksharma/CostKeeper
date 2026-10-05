'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

import { SortHeader } from '@/components/sort-header'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency } from '@/lib/utils'
import { Actions } from '../../transactions/actions'

export type ContributionRow = {
    id: string
    date: string
    payee: string | null
    notes: string | null
    amount: number
    account: string
}

export const columns: ColumnDef<ContributionRow>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
    },
    {
        accessorKey: 'date',
        header: ({ column }) => <SortHeader column={column} label="Date" />,
        cell: ({ row }) => (
            <span className="tabular-nums text-muted-foreground">
                {format(new Date(row.original.date), 'dd MMM yyyy')}
            </span>
        ),
    },
    {
        accessorKey: 'payee',
        header: ({ column }) => (
            <SortHeader column={column} label="Description" />
        ),
        cell: ({ row }) => (
            <div className="max-w-[28ch]">
                <p className="truncate font-medium">{row.original.payee}</p>
                {row.original.notes && (
                    <p className="truncate text-xs text-muted-foreground">
                        {row.original.notes}
                    </p>
                )}
            </div>
        ),
    },
    {
        accessorKey: 'account',
        header: ({ column }) => <SortHeader column={column} label="Account" />,
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.account}
            </span>
        ),
    },
    {
        accessorKey: 'amount',
        header: ({ column }) => (
            <div className="flex justify-end">
                <SortHeader column={column} label="Amount" align="right" />
            </div>
        ),
        cell: ({ row }) => (
            <div className="text-right font-mono text-[13px] font-medium tabular-nums">
                {formatCurrency(row.original.amount)}
            </div>
        ),
    },
    {
        id: 'actions',
        cell: ({ row }) => <Actions id={row.original.id} />,
    },
]
