'use client'

import { ArrowLeftRight, Plus, Repeat } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { ParseResult } from 'papaparse'
import { DataTable } from '@/components/data-table'
import { EmptyState } from '@/components/empty-state'
import { ListCard, ListCardSkeleton } from '@/components/list-card'
import { Button } from '@/components/ui/button'
import { useSelectAccount } from '@/features/accounts/hooks/use-select-account'
import { useBulkCreateTransactions } from '@/features/transactions/api/use-bulk-create-transactions'
import { useBulkDeleteTransactions } from '@/features/transactions/api/use-bulk-delete-transactions'
import { useGetTransactions } from '@/features/transactions/api/use-get-transactions'
import { CopyIncomeDialog } from '@/features/transactions/components/copy-income-dialog'
import { useNewTransaction } from '@/features/transactions/hooks/use-new-transaction'

import { columns } from './columns'
import { type ImportedTransaction, ImportCard } from './import-card'
import { UploadButton } from './upload-button'

enum VARIANTS {
    LIST = 'LIST',
    IMPORT = 'IMPORT',
}

const TransactionsPage = () => {
    const [variant, setVariant] = useState<VARIANTS>(VARIANTS.LIST)
    const [importResults, setImportResults] = useState<string[][]>([])
    const [copyIncomeOpen, setCopyIncomeOpen] = useState(false)
    const [AccountDialog, confirm] = useSelectAccount()
    const newTransaction = useNewTransaction()
    const createTransactions = useBulkCreateTransactions()
    const deleteTransactions = useBulkDeleteTransactions()
    const transactionsQuery = useGetTransactions()

    const transactions = useMemo(() => {
        return transactionsQuery.data?.pages.flatMap((page) => page.data) || []
    }, [transactionsQuery.data])

    const onUpload = (results: ParseResult<string[]>) => {
        setImportResults(results.data)
        setVariant(VARIANTS.IMPORT)
    }

    const onCancelImport = () => {
        setImportResults([])
        setVariant(VARIANTS.LIST)
    }

    const onSubmitImport = async (values: ImportedTransaction[]) => {
        const accountId = await confirm()

        if (!accountId) {
            return toast.error('Please select an account to continue.')
        }

        const data = values.map((value) => ({
            ...value,
            accountId: accountId as string,
        }))

        // KNOWN GAP: the CSV mapper can only produce amount/payee/date, but
        // `/bulk-create` validates against insertTransactionSchema, where
        // categoryId is notNull. The request is rejected with a 400 until the
        // importer can supply (or default) a category. Cast preserves the
        // existing behaviour rather than silently inventing a category.
        createTransactions.mutate(
            data as unknown as Parameters<typeof createTransactions.mutate>[0],
            {
                onSuccess: () => {
                    onCancelImport()
                },
            }
        )
    }

    const isDisabled =
        transactionsQuery.isLoading || deleteTransactions.isPending
    if (transactionsQuery.isLoading) {
        return <ListCardSkeleton />
    }

    if (variant === VARIANTS.IMPORT) {
        return (
            <>
                <AccountDialog />
                <ImportCard
                    data={importResults}
                    onCancel={onCancelImport}
                    onSubmit={onSubmitImport}
                />
            </>
        )
    }
    return (
        <>
            <CopyIncomeDialog
                open={copyIncomeOpen}
                onOpenChange={setCopyIncomeOpen}
            />
            <ListCard
                title="All transactions"
                actions={
                    <>
                        <UploadButton onUpload={onUpload} />
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCopyIncomeOpen(true)}
                        >
                            <Repeat className="size-4" />
                            Copy last month&apos;s income
                        </Button>
                        <Button size="sm" onClick={newTransaction.onOpen}>
                            <Plus className="size-4" /> Add transaction
                        </Button>
                    </>
                }
            >
                <DataTable
                    filterKey="payee"
                    filterPlaceholder="Search by payee"
                    columns={columns}
                    data={transactions}
                    onDelete={(row) => {
                        const ids = row.map((r) => r.original.id)

                        deleteTransactions.mutate({ ids })
                    }}
                    disabled={isDisabled}
                    amountKey="amount"
                    fetchNextPage={transactionsQuery.fetchNextPage}
                    hasNextPage={transactionsQuery.hasNextPage}
                    isFetchingNextPage={transactionsQuery.isFetchingNextPage}
                    emptyState={
                        <EmptyState
                            icon={ArrowLeftRight}
                            title="No transactions in this period"
                            description="Add one by hand, import a CSV from your bank, or change the date range above."
                            action={
                                <Button
                                    size="sm"
                                    onClick={newTransaction.onOpen}
                                >
                                    <Plus className="size-4" /> Add transaction
                                </Button>
                            }
                        />
                    }
                />
            </ListCard>
        </>
    )
}

export default TransactionsPage
