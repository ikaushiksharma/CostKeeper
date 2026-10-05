import { type FormEvent, useEffect, useId, useState } from 'react'

import { DatePicker } from '@/components/date-picker'
import { DateTimePicker } from '@/components/date-time-picker'
import { MoneyInput } from '@/components/money-input'
import { Select as CreatableSelect } from '@/components/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useCreateAccount } from '@/features/accounts/api/use-create-account'
import { useGetAccounts } from '@/features/accounts/api/use-get-accounts'
import { useGetSettings } from '@/features/settings/api/use-get-settings'
import { KIND_COPY } from '@/lib/goals'
import { convertAmountToMilliunits } from '@/lib/utils'
import { useCreateContribution } from '../api/use-create-contribution'
import { useGetGoal } from '../api/use-get-goal'
import { useContributionSheet } from '../hooks/use-contribution-sheet'

const TITLE = {
    save: 'Add money',
    payoff: 'Log a payment',
    allowance: 'Log spending',
} as const

export const ContributionSheet = () => {
    const { isOpen, goalId, onClose } = useContributionSheet()
    const goal = useGetGoal(goalId).data
    const accountsQuery = useGetAccounts()
    const accountMutation = useCreateAccount()
    const settingsQuery = useGetSettings()
    const mutation = useCreateContribution(goalId)
    const ids = { amount: useId(), payee: useId(), notes: useId() }

    const [amount, setAmount] = useState('')
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [payee, setPayee] = useState('')
    const [notes, setNotes] = useState('')
    const [accountId, setAccountId] = useState<string | undefined>()
    const [error, setError] = useState<string | null>(null)

    // biome-ignore lint/correctness/useExhaustiveDependencies: reset only when the sheet opens for a goal.
    useEffect(() => {
        if (!isOpen) return
        setAmount('')
        setDate(new Date())
        setPayee('')
        setNotes('')
        setError(null)
        setAccountId(
            goal?.accountId || settingsQuery.data?.defaultAccountId || undefined
        )
    }, [isOpen, goal?.id])

    const accountOptions = (accountsQuery.data ?? []).map((a) => ({
        label: a.name,
        value: a.id,
    }))

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (!amount || Number.parseFloat(amount) <= 0)
            return setError('Enter an amount above zero')
        if (!date) return setError('Pick a date')
        if (!accountId) return setError('Pick an account')
        setError(null)
        mutation.mutate(
            {
                amount: Math.round(
                    convertAmountToMilliunits(Number.parseFloat(amount))
                ),
                date,
                payee: payee.trim() || null,
                notes: notes.trim() || null,
                accountId,
            },
            { onSuccess: onClose }
        )
    }

    const kind = goal?.kind ?? 'save'
    const isPending = mutation.isPending || accountMutation.isPending

    return (
        <Sheet open={isOpen || mutation.isPending} onOpenChange={onClose}>
            <SheetContent className="space-y-4">
                <SheetHeader>
                    <SheetTitle>{TITLE[kind]}</SheetTitle>
                    <SheetDescription>
                        {goal
                            ? `Counts toward ${goal.name}. It is kept out of your income and expense totals.`
                            : 'Counts toward this goal.'}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor={ids.amount}>
                            Amount {KIND_COPY[kind].done}
                        </Label>
                        <MoneyInput
                            id={ids.amount}
                            value={amount}
                            onChange={setAmount}
                            className="h-12 text-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Date</Label>
                        {settingsQuery.data?.dateTimeMode ? (
                            <DateTimePicker value={date} onChange={setDate} />
                        ) : (
                            <DatePicker
                                value={date}
                                onChange={(d) => setDate(d)}
                            />
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>From account</Label>
                        <CreatableSelect
                            placeholder="Pick an account"
                            options={accountOptions}
                            value={accountId}
                            onChange={setAccountId}
                            onCreate={(name) =>
                                accountMutation.mutate(
                                    { name },
                                    {
                                        onSuccess: (res) => {
                                            if ('data' in res)
                                                setAccountId(res.data.id)
                                        },
                                    }
                                )
                            }
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={ids.payee}>
                            Description (optional)
                        </Label>
                        <Input
                            id={ids.payee}
                            value={payee}
                            onChange={(e) => setPayee(e.target.value)}
                            placeholder={
                                kind === 'save'
                                    ? 'e.g. SIP or Lumpsum'
                                    : kind === 'payoff'
                                      ? 'e.g. Monthly EMI'
                                      : 'e.g. Flight tickets'
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={ids.notes}>Notes (optional)</Label>
                        <Textarea
                            id={ids.notes}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button className="w-full" size="lg" disabled={isPending}>
                        {TITLE[kind]}
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    )
}
