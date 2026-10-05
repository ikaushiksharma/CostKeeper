'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { WalletCards } from 'lucide-react'
import qs from 'query-string'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useGetAccounts } from '@/features/accounts/api/use-get-accounts'
import { useGetSummary } from '@/features/summary/api/use-get-summary'

export const AccountFilter = () => {
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()

    const { isLoading: isLoadingSummary } = useGetSummary()

    const accountId = searchParams.get('accountId') || 'all'
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''

    const onChange = (newValue: string) => {
        const query = {
            accountId: newValue,
            from,
            to,
        }

        if (newValue === 'all') query.accountId = ''

        const url = qs.stringifyUrl(
            {
                url: pathname,
                query,
            },
            { skipNull: true, skipEmptyString: true }
        )

        router.push(url)
    }

    const { data: accounts, isLoading: isLoadingAccounts } = useGetAccounts()
    return (
        <Select
            value={accountId}
            onValueChange={onChange}
            disabled={isLoadingAccounts || isLoadingSummary}
        >
            <SelectTrigger
                aria-label="Filter by account"
                className="sm:w-auto sm:min-w-40 w-full gap-2 bg-card hover:bg-accent transition-colors"
            >
                <WalletCards className="size-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Select account" />
            </SelectTrigger>

            <SelectContent>
                <SelectItem value="all">All accounts</SelectItem>

                {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                        {account.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
