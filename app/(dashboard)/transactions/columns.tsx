'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import type { InferResponseType } from 'hono'

import { SortHeader } from '@/components/sort-header'
import { Checkbox } from '@/components/ui/checkbox'
import type { client } from '@/lib/hono'
import { cn, formatCurrency } from '@/lib/utils'
import { AccountColumn } from './account-column'
import { Actions } from './actions'
import { CategoryColumn } from './category-column'

export type ResponseType = InferResponseType<
    typeof client.api.transactions.$get,
    200
>['data'][0]

export const columns: ColumnDef<ResponseType>[] = [
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
        enableHiding: false,
    },
    {
        accessorKey: 'date',
        header: ({ column }) => <SortHeader column={column} label="Date" />,
        cell: ({ row }) => {
            const date = row.getValue('date') as Date

            return (
                <span className="tabular-nums text-muted-foreground">
                    {format(date, 'dd MMM yyyy')}
                </span>
            )
        },
    },
    {
        accessorKey: 'category',
        header: ({ column }) => <SortHeader column={column} label="Category" />,
        cell: ({ row }) => {
            return (
                <CategoryColumn
                    id={row.original.id}
                    category={row.original.category}
                    categoryId={row.original.categoryId}
                />
            )
        },
    },
    {
        accessorKey: 'payee',
        header: ({ column }) => <SortHeader column={column} label="Payee" />,
        cell: ({ row }) => (
            <span className="font-medium">
                {row.original.payee || (
                    <span className="text-muted-foreground font-normal">
                        No payee
                    </span>
                )}
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
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue('amount'))

            return (
                <div
                    className={cn(
                        'text-right font-mono text-[13px] font-medium tabular-nums',
                        amount < 0 ? 'text-foreground' : 'text-income'
                    )}
                >
                    {amount > 0 && '+'}
                    {formatCurrency(amount)}
                </div>
            )
        },
    },
    {
        accessorKey: 'account',
        header: ({ column }) => <SortHeader column={column} label="Account" />,
        cell: ({ row }) => {
            return (
                <AccountColumn
                    account={row.original.account}
                    accountId={row.original.accountId}
                />
            )
        },
    },

    {
        id: 'actions',
        cell: ({ row }) => <Actions id={row.original.id} />,
    },
]
