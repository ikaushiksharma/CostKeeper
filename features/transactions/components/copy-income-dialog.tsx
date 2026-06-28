'use client'

import {
    endOfMonth,
    format,
    getDate,
    setDate,
    startOfMonth,
    subMonths,
} from 'date-fns'
import {
    ArrowRight,
    CheckSquare,
    CopyCheck,
    Loader2,
    Square,
    TrendingUp,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useBulkCreateTransactions } from '@/features/transactions/api/use-bulk-create-transactions'
import { useGetLastMonthIncome } from '@/features/transactions/api/use-get-last-month-income'
import { convertAmountToMilliunits, formatCurrency } from '@/lib/utils'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

function getSuggestedDate(originalDate: string | Date): Date {
    const now = new Date()
    const day = getDate(new Date(originalDate))
    const thisMonthSameDay = setDate(startOfMonth(now), day)
    const lastDayOfMonth = endOfMonth(now)
    return thisMonthSameDay > lastDayOfMonth ? lastDayOfMonth : thisMonthSameDay
}

export const CopyIncomeDialog = ({ open, onOpenChange }: Props) => {
    const now = new Date()
    const lastMonth = subMonths(now, 1)
    const lastMonthLabel = format(lastMonth, 'MMMM yyyy')
    const thisMonthLabel = format(now, 'MMMM yyyy')

    const incomeQuery = useGetLastMonthIncome(open)
    const bulkCreate = useBulkCreateTransactions()

    const [selected, setSelected] = useState<Set<string>>(new Set())

    // Select all by default when data loads
    useEffect(() => {
        if (incomeQuery.data) {
            setSelected(new Set(incomeQuery.data.map((t) => t.id)))
        }
    }, [incomeQuery.data])

    const toggleItem = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const allSelected =
        incomeQuery?.data?.length &&
        selected.size === (incomeQuery?.data?.length || 0)

    const toggleAll = () => {
        if (allSelected) {
            setSelected(new Set())
        } else {
            setSelected(new Set(incomeQuery.data?.map((t) => t.id) ?? []))
        }
    }

    const handleConfirm = () => {
        const toCreate =
            incomeQuery.data
                ?.filter((t) => selected.has(t.id))
                .map((t) => ({
                    date: getSuggestedDate(t.date),
                    payee: t.payee,
                    notes: t.notes,
                    amount: convertAmountToMilliunits(t.amount),
                    accountId: t.accountId,
                    categoryId: t.categoryId,
                })) ?? []

        bulkCreate.mutate(toCreate, {
            onSuccess: () => {
                onOpenChange(false)
            },
        })
    }

    const isEmpty = !incomeQuery.isLoading && incomeQuery.data?.length === 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="flex size-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                            <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <DialogTitle>Copy Last Month&apos;s Income</DialogTitle>
                    </div>
                    <DialogDescription className="pt-1">
                        Re-create your income entries from{' '}
                        <span className="font-medium text-foreground">
                            {lastMonthLabel}
                        </span>{' '}
                        into{' '}
                        <span className="font-medium text-foreground">
                            {thisMonthLabel}
                        </span>
                        . Dates are shifted to the same day of this month.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-[180px]">
                    {incomeQuery.isLoading ? (
                        <div className="space-y-3 py-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 rounded-lg border p-3"
                                >
                                    <Skeleton className="size-4 rounded" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : isEmpty ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
                            <CopyCheck className="size-10 opacity-30" />
                            <p className="text-sm">
                                No income recorded in {lastMonthLabel}.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Select all toggle */}
                            <button
                                onClick={toggleAll}
                                className="mb-2 flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {allSelected ? (
                                    <CheckSquare className="size-4 text-emerald-600" />
                                ) : (
                                    <Square className="size-4" />
                                )}
                                {allSelected ? 'Deselect all' : 'Select all'}
                                <span className="ml-auto text-xs">
                                    {selected.size} / {incomeQuery.data?.length}{' '}
                                    selected
                                </span>
                            </button>
                            <Separator className="mb-3" />
                            <ScrollArea className="max-h-[280px] pr-1">
                                <div className="space-y-2">
                                    {incomeQuery.data?.map((t) => {
                                        const suggestedDate = getSuggestedDate(
                                            t.date
                                        )
                                        const isSelected = selected.has(t.id)
                                        return (
                                            <button
                                                key={t.id}
                                                onClick={() => toggleItem(t.id)}
                                                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                                                    isSelected
                                                        ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10'
                                                        : 'border-border hover:bg-muted/40'
                                                }`}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() =>
                                                        toggleItem(t.id)
                                                    }
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                    className="pointer-events-none data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium leading-none">
                                                        {t.payee ||
                                                            t.category ||
                                                            'Unknown'}
                                                    </p>
                                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <span>
                                                            {format(
                                                                new Date(
                                                                    t.date
                                                                ),
                                                                'MMM d'
                                                            )}
                                                        </span>
                                                        <ArrowRight className="size-3" />
                                                        <span className="font-medium text-foreground">
                                                            {format(
                                                                suggestedDate,
                                                                'MMM d'
                                                            )}
                                                        </span>
                                                        {t.account && (
                                                            <>
                                                                <span className="mx-0.5">
                                                                    ·
                                                                </span>
                                                                <span>
                                                                    {t.account}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className="shrink-0 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                                                >
                                                    +{formatCurrency(t.amount)}
                                                </Badge>
                                            </button>
                                        )
                                    })}
                                </div>
                            </ScrollArea>
                        </>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={bulkCreate.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={
                            selected.size === 0 ||
                            bulkCreate.isPending ||
                            isEmpty
                        }
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {bulkCreate.isPending ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Copying…
                            </>
                        ) : (
                            <>
                                <CopyCheck className="mr-2 size-4" />
                                Copy {selected.size > 0
                                    ? selected.size
                                    : ''}{' '}
                                {selected.size === 1
                                    ? 'transaction'
                                    : 'transactions'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
