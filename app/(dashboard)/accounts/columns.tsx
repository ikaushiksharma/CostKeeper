'use client'

import type { ColumnDef } from '@tanstack/react-table'
import type { InferResponseType } from 'hono'

import { SortHeader } from '@/components/sort-header'
import { Checkbox } from '@/components/ui/checkbox'
import type { client } from '@/lib/hono'
import { Actions } from './actions'

export type ResponseType = InferResponseType<
    typeof client.api.accounts.$get,
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
        accessorKey: 'name',
        header: ({ column }) => <SortHeader column={column} label="Name" />,
    },
    {
        id: 'actions',
        size: 48,
        cell: ({ row }) => <Actions id={row.original.id} />,
    },
]
