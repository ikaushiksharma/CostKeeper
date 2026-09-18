import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

import { TableHeadSelect } from './table-head-select'

type ImportTableProps = {
    headers: string[]
    body: string[][]
    selectedColumns: Record<string, string | null>
    onTableHeadSelectChange: (columnIndex: number, value: string | null) => void
}

export const ImportTable = ({
    headers,
    body,
    onTableHeadSelectChange,
    selectedColumns,
}: ImportTableProps) => {
    return (
        <div className="rounded-md border overflow-hidden">
            <Table>
                <TableHeader className="bg-muted">
                    <TableRow>
                        {headers.map((_header, index) => (
                            // biome-ignore lint/suspicious/noArrayIndexKey: CSV columns are positional and never reordered; the index is the column identity.
                            <TableHead key={index}>
                                <TableHeadSelect
                                    columnIndex={index}
                                    selectedColumns={selectedColumns}
                                    onChange={onTableHeadSelectChange}
                                />
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {body.map((row: string[], index) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: static CSV preview; rows are never reordered or keyed by content.
                        <TableRow key={index}>
                            {row.map((cell, cellIndex) => (
                                // biome-ignore lint/suspicious/noArrayIndexKey: cells are positional within a fixed row.
                                <TableCell key={cellIndex}>{cell}</TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
