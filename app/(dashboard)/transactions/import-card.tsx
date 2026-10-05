import { useState } from 'react'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { ImportTable } from './import-table'
import { convertAmountToMilliunits } from '@/lib/utils'
import { format, parse } from 'date-fns'
const dateFormat = 'yyyy-MM-dd HH:mm:ss'
const outputFormat = 'yyyy-MM-dd'

const requiredOptions = ['amount', 'date', 'payee']

type SelectedColumnsState = {
    [key: string]: string | null
}

// Rows are keyed by whichever headers the user mapped, with amount/date
// normalised for the API. accountId is attached by the caller afterwards.
export type ImportedTransaction = Record<string, string | number> & {
    amount: number
    date: string
}

type ImportCardProps = {
    data: string[][]
    onCancel: () => void
    onSubmit: (data: ImportedTransaction[]) => void
}

export const ImportCard = ({ data, onCancel, onSubmit }: ImportCardProps) => {
    const [selectedColumns, setSelectedColumns] =
        useState<SelectedColumnsState>({})

    const headers = data[0]
    const body = data.slice(1)

    const onTableHeadSelectChange = (
        columnIndex: number,
        value: string | null
    ) => {
        setSelectedColumns((prev) => {
            const newSelectedColumns = { ...prev }

            for (const key in newSelectedColumns) {
                if (newSelectedColumns[key] === value) {
                    newSelectedColumns[key] = null
                }
            }

            if (value === 'skip') value = null

            newSelectedColumns[`column_${columnIndex}`] = value

            return newSelectedColumns
        })
    }
    const progress = Object.values(selectedColumns).filter(Boolean).length

    const handleContinue = () => {
        const getColumnIndex = (column: string) => {
            return column.split('_')[1]
        }

        // map headers and body to the selected fields and set non-selected fields to null.
        const mappedData = {
            headers: headers.map((_header, index) => {
                const columnIndex = getColumnIndex(`column_${index}`)

                return selectedColumns[`column_${columnIndex}`] || null
            }),
            body: body
                .map((row) => {
                    const transformedRow = row.map((cell, index) => {
                        const columnIndex = getColumnIndex(`column_${index}`)

                        return selectedColumns[`column_${columnIndex}`]
                            ? cell
                            : null
                    })

                    return transformedRow.every((item) => item === null)
                        ? []
                        : transformedRow
                })
                .filter((row) => row.length > 0),
        }

        // convert it to array of objects so that it can be inserted into database.
        const arrayOfData = mappedData.body.map((row) => {
            return row.reduce<Record<string, string>>((acc, cell, index) => {
                const header = mappedData.headers[index]

                if (header !== null && cell !== null) acc[header] = cell

                return acc
            }, {})
        })

        // format currency and date to match it with database
        const formattedData = arrayOfData.map((item) => ({
            ...item,
            amount: convertAmountToMilliunits(parseFloat(item.amount)),
            date: format(
                parse(item.date, dateFormat, new Date()),
                outputFormat
            ),
        }))

        onSubmit(formattedData)
    }

    return (
        <Card>
            <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                <div className="space-y-1.5">
                    <CardTitle>Map your CSV columns</CardTitle>
                    <CardDescription>
                        Use the menu above each column to mark which one holds
                        the date, payee and amount. Leave the rest as Skip.
                    </CardDescription>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                    <Button size="sm" variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        disabled={progress < requiredOptions.length}
                        onClick={handleContinue}
                        className="tabular-nums"
                    >
                        Continue ({progress}/{requiredOptions.length} mapped)
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                <ImportTable
                    headers={headers}
                    body={body}
                    selectedColumns={selectedColumns}
                    onTableHeadSelectChange={onTableHeadSelectChange}
                />
            </CardContent>
        </Card>
    )
}
