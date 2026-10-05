'use client'

import {
    type ColumnDef,
    type ColumnFiltersState,
    type Row,
    type SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Loader2, Search, Trash2 } from 'lucide-react'
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
    filterPlaceholder?: string
    emptyState?: React.ReactNode
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
    filterPlaceholder,
    emptyState,
    onDelete,
    disabled,
    amountKey,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
}: DataTableProps<TData, TValue>) {
    const [ConfirmDialog, confirm] = useConfirm(
        'Delete selected rows?',
        "This can't be undone.",
        { confirmLabel: 'Delete', destructive: true }
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

    const selectedRows = table.getFilteredSelectedRowModel().rows
    const filterValue =
        (table.getColumn(filterKey)?.getFilterValue() as string) ?? ''
    const total = React.useMemo(() => {
        if (!amountKey) return null
        return selectedRows.reduce((sum, row) => {
            const amount = row.original[amountKey]
            return sum + (typeof amount === 'number' ? amount : 0)
        }, 0)
    }, [selectedRows, amountKey])

    return (
        <div>
            <ConfirmDialog />
            <div className="flex flex-col-reverse gap-2 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        aria-label={filterPlaceholder ?? `Search ${filterKey}`}
                        placeholder={filterPlaceholder ?? `Search ${filterKey}`}
                        value={filterValue}
                        onChange={(event) =>
                            table
                                .getColumn(filterKey)
                                ?.setFilterValue(event.target.value)
                        }
                        className="pl-9"
                    />
                </div>

                {selectedRows.length > 0 && (
                    <Button
                        disabled={disabled}
                        size="sm"
                        variant="destructive-ghost"
                        className="self-end sm:self-auto"
                        onClick={async () => {
                            const ok = await confirm()

                            if (ok) {
                                onDelete(selectedRows)
                                table.resetRowSelection()
                            }
                        }}
                    >
                        <Trash2 className="size-4" />
                        Delete {selectedRows.length} selected
                    </Button>
                )}
            </div>
            <div
                ref={tableContainerRef}
                className="relative h-[calc(100dvh-22rem)] min-h-[320px] overflow-auto rounded-md border"
            >
                <Table className="min-w-full">
                    <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className="h-10 whitespace-nowrap px-4 py-1"
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
                                                    className="h-12 text-center whitespace-nowrap px-4 py-2 text-sm text-muted-foreground"
                                                >
                                                    {hasNextPage ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Loader2 className="size-4 animate-spin" />
                                                            Loading more...
                                                        </div>
                                                    ) : (
                                                        "That's everything"
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
                                                        className="whitespace-nowrap px-4 py-2.5"
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
                                    className="h-64 text-center hover:bg-transparent"
                                >
                                    {filterValue || !emptyState ? (
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">
                                                No matches
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {filterValue
                                                    ? `Nothing matches "${filterValue}". Try a different search.`
                                                    : 'Nothing to show yet.'}
                                            </p>
                                        </div>
                                    ) : (
                                        emptyState
                                    )}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between pt-3 text-sm text-muted-foreground">
                <p className="tabular-nums">
                    {selectedRows.length > 0
                        ? `${selectedRows.length} of ${rows.length} selected`
                        : `${rows.length} ${rows.length === 1 ? 'row' : 'rows'}`}
                    {selectedRows.length > 0 && total !== null && (
                        <span className="ml-3 font-medium text-foreground">
                            Total {formatCurrency(total)}
                        </span>
                    )}
                </p>
                {isFetchingNextPage && (
                    <div className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        Loading more
                    </div>
                )}
            </div>
        </div>
    )
}
