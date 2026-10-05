import { useOpenAccount } from '@/features/accounts/hooks/use-open-account'

type AccountColumnProps = {
    account: string
    accountId: string
}

export const AccountColumn = ({ account, accountId }: AccountColumnProps) => {
    const { onOpen: onOpenAccount } = useOpenAccount()

    const onClick = () => onOpenAccount(accountId)

    return (
        <button
            type="button"
            onClick={onClick}
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
            {account}
        </button>
    )
}
