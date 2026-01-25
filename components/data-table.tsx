'use client'

import {
    ColumnDef,
    ColumnFiltersState,
    Row,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Loader2, Trash } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useConfirm } from '@/hooks/use-confirm'
import { formatCurrency } from '@/lib/utils'

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    filterKey: string
    onDelete: (rows: Row<TData>[]) => void
    disabled?: boolean
    amountKey?: keyof TData
    fetchNextPage?: () => void
    hasNextPage?: boolean
    isFetchingNextPage?: boolean
}

export function DataTable<TData, TValue>({
    columns,
    data,
    filterKey,
    onDelete,
    disabled,
    amountKey,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
}: DataTableProps<TData, TValue>) {
    const [ConfirmDialog, confirm] = useConfirm(
        'Are you sure?',
        'You are about to perform a bulk delete.'
    )
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([])
    const [rowSelection, setRowSelection] = React.useState({})

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnFiltersChange: setColumnFilters,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            rowSelection,
        },
    })

    const { rows } = table.getRowModel()

    const tableContainerRef = React.useRef<HTMLDivElement>(null)

    const rowVirtualizer = useVirtualizer({
        count: hasNextPage ? rows.length + 1 : rows.length,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => 50,
        overscan: 10,
        measureElement:
            typeof window !== 'undefined' &&
            navigator.userAgent.indexOf('Firefox') === -1
                ? (element) => element?.getBoundingClientRect().height
                : undefined,
    })

    const virtualItems = rowVirtualizer.getVirtualItems()

    // Infinite scroll trigger
    const lastItemIndex = virtualItems[virtualItems.length - 1]?.index ?? -1

    React.useEffect(() => {
        if (lastItemIndex === -1) {
            return
        }

        if (
            lastItemIndex >= rows.length - 1 &&
            hasNextPage &&
            !isFetchingNextPage &&
            fetchNextPage
        ) {
            fetchNextPage()
        }
    }, [
        hasNextPage,
        fetchNextPage,
        rows.length,
        isFetchingNextPage,
        lastItemIndex,
    ])

    const total = React.useMemo(() => {
        if (!amountKey) return null
        return table.getFilteredSelectedRowModel().rows.reduce((sum, row) => {
            const amount = row.original[amountKey]
            return sum + (typeof amount === 'number' ? amount : 0)
        }, 0)
    }, [table.getFilteredSelectedRowModel().rows, amountKey])

    return (
        <div>
            <ConfirmDialog />
            <div className="flex items-center py-4">
                <Input
                    placeholder={`Filter ${filterKey}...`}
                    value={
                        (table
                            .getColumn(filterKey)
                            ?.getFilterValue() as string) ?? ''
                    }
                    onChange={(event) =>
                        table
                            .getColumn(filterKey)
                            ?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />

                {table.getFilteredSelectedRowModel().rows.length > 0 && (
                    <Button
                        disabled={disabled}
                        size="sm"
                        variant="outline"
                        className="ml-auto font-normal text-xs"
                        onClick={async () => {
                            const ok = await confirm()

                            if (ok) {
                                onDelete(
                                    table.getFilteredSelectedRowModel().rows
                                )
                                table.resetRowSelection()
                            }
                        }}
                    >
                        <Trash className="size-4 mr-2" />
                        Delete (
                        {table.getFilteredSelectedRowModel().rows.length})
                    </Button>
                )}
            </div>
            <div
                ref={tableContainerRef}
                className="rounded-md border h-[50vh] overflow-auto relative"
            >
                <Table className="min-w-full">
                    <TableHeader className="sticky top-0 z-10 bg-background">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className="whitespace-nowrap px-4 py-2"
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext()
                                                  )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {virtualItems.length ? (
                            <>
                                {/* Top padding row for virtualization */}
                                {virtualItems[0]?.start > 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            style={{
                                                height: virtualItems[0]?.start,
                                                padding: 0,
                                            }}
                                        />
                                    </TableRow>
                                )}
                                {virtualItems.map((virtualRow) => {
                                    const isLoaderRow =
                                        virtualRow.index > rows.length - 1
                                    const row = rows[virtualRow.index]

                                    if (isLoaderRow) {
                                        return (
                                            <TableRow
                                                key="loader"
                                                data-index={virtualRow.index}
                                                ref={
                                                    rowVirtualizer.measureElement
                                                }
                                            >
                                                <TableCell
                                                    colSpan={columns.length}
                                                    className="h-12 text-center whitespace-nowrap px-4 py-2"
                                                >
                                                    {hasNextPage ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Loader2 className="size-4 animate-spin" />
                                                            Loading more...
                                                        </div>
                                                    ) : (
                                                        'No more data'
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    }

                                    return (
                                        <TableRow
                                            key={row.id}
                                            data-index={virtualRow.index}
                                            ref={rowVirtualizer.measureElement}
                                            data-state={
                                                row.getIsSelected() &&
                                                'selected'
                                            }
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        className="whitespace-nowrap px-4 py-2"
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))}
                                        </TableRow>
                                    )
                                })}
                                {/* Bottom padding row for virtualization */}
                                {virtualItems[virtualItems.length - 1]?.end <
                                    rowVirtualizer.getTotalSize() && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            style={{
                                                height:
                                                    rowVirtualizer.getTotalSize() -
                                                    virtualItems[
                                                        virtualItems.length - 1
                                                    ]?.end,
                                                padding: 0,
                                            }}
                                        />
                                    </TableRow>
                                )}
                            </>
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{' '}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                    {!!total && (
                        <span className="ml-2">
                            Total: {formatCurrency(total)}
                        </span>
                    )}
                </div>
                {isFetchingNextPage && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        Loading more...
                    </div>
                )}
            </div>
        </div>
    )
}
