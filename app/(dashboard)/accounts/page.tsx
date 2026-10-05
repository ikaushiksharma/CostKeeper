'use client'
import { Plus, Shapes, WalletCards } from 'lucide-react'
import Link from 'next/link'

import { DataTable } from '@/components/data-table'
import { EmptyState } from '@/components/empty-state'
import { ListCard, ListCardSkeleton } from '@/components/list-card'
import { Button } from '@/components/ui/button'
import { useBulkDeleteAccounts } from '@/features/accounts/api/use-bulk-delete-accounts'
import { useGetAccounts } from '@/features/accounts/api/use-get-accounts'
import { useNewAccount } from '@/features/accounts/hooks/use-new-account'

import { columns } from './columns'

const AccountsPage = () => {
    const newAccount = useNewAccount()
    const deleteAccounts = useBulkDeleteAccounts()
    const accountsQuery = useGetAccounts()
    const accounts = accountsQuery.data || []

    const isDisabled = accountsQuery.isLoading || deleteAccounts.isPending

    if (accountsQuery.isLoading) {
        return <ListCardSkeleton rows={5} />
    }

    return (
        <ListCard
            title="Your accounts"
            count={accounts.length}
            actions={
                <>
                    <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="md:hidden"
                    >
                        <Link href="/categories">
                            <Shapes className="size-4" /> Categories
                        </Link>
                    </Button>
                    <Button size="sm" onClick={newAccount.onOpen}>
                        <Plus className="size-4" /> New account
                    </Button>
                </>
            }
        >
            <DataTable
                filterKey="name"
                filterPlaceholder="Search accounts"
                columns={columns}
                data={accounts}
                onDelete={(row) => {
                    const ids = row.map((r) => r.original.id)

                    deleteAccounts.mutate({ ids })
                }}
                disabled={isDisabled}
                emptyState={
                    <EmptyState
                        icon={WalletCards}
                        title="No accounts yet"
                        description="Add the places your money lives, like a bank account, cash or a credit card."
                        action={
                            <Button size="sm" onClick={newAccount.onOpen}>
                                <Plus className="size-4" /> New account
                            </Button>
                        }
                    />
                }
            />
        </ListCard>
    )
}

export default AccountsPage
