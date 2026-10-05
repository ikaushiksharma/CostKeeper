import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { type DefaultValues, useForm } from 'react-hook-form'
import { z } from 'zod'

import { AmountInput } from '@/components/amount-input'
import { Select } from '@/components/select'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { insertTransactionSchema } from '@/db/schema'
import { convertAmountToMilliunits } from '@/lib/utils'
import { DateTimePicker } from '@/components/date-time-picker'
import { DatePicker } from '@/components/date-picker'
import { useEffect, useState } from 'react'
import { useGetSettings } from '@/features/settings/api/use-get-settings'

const formSchema = z.object({
    date: z.coerce.date({ invalid_type_error: 'Pick a date' }),
    accountId: z.string({ required_error: 'Pick an account' }),
    categoryId: z.string({ required_error: 'Pick a category' }),
    payee: z.string().nullable().optional(),
    amount: z
        .string({ required_error: 'Enter an amount' })
        .min(1, 'Enter an amount')
        .refine((v) => Number.parseFloat(v) !== 0, 'Amount must not be zero'),
    notes: z.string().nullable().optional(),
})

const apiSchema = insertTransactionSchema.omit({
    id: true,
})

export type FormValues = z.input<typeof formSchema>
type ApiFormValues = z.input<typeof apiSchema>

type TransactionFormProps = {
    id?: string
    defaultValues?: DefaultValues<FormValues>
    onSubmit: (values: ApiFormValues) => void
    onDelete?: () => void
    disabled?: boolean
    accountOptions: { label: string; value: string }[]
    categoryOptions: { label: string; value: string }[]
    onCreateAccount: (name: string) => void
    onCreateCategory: (name: string) => void
}

export const TransactionForm = ({
    id,
    defaultValues,
    onSubmit,
    onDelete,
    disabled,
    accountOptions,
    categoryOptions,
    onCreateAccount,
    onCreateCategory,
}: TransactionFormProps) => {
    const [onlyDate, setOnlyDate] = useState(true)
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
    })

    const settingsQuery = useGetSettings()
    const settings = settingsQuery.data

    useEffect(() => {
        if (settings?.dateTimeMode) {
            setOnlyDate(false)
        }
    }, [settings])

    const handleSubmit = (values: FormValues) => {
        const amount = parseFloat(values.amount)
        const amountInMilliunits = convertAmountToMilliunits(amount)
        onSubmit({
            ...values,
            amount: amountInMilliunits,
        })
    }

    const handleDelete = () => {
        onDelete?.()
    }
    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                autoCapitalize="off"
                autoComplete="off"
                className="space-y-5 pt-2"
            >
                <FormField
                    name="amount"
                    control={form.control}
                    disabled={disabled}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount</FormLabel>

                            <FormControl>
                                <AmountInput
                                    {...field}
                                    disabled={disabled}
                                    placeholder="0"
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    name="payee"
                    control={form.control}
                    disabled={disabled}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Payee</FormLabel>

                            <FormControl>
                                <Input
                                    disabled={disabled}
                                    placeholder="Who was it paid to or from?"
                                    {...field}
                                    value={field.value || ''}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        name="categoryId"
                        control={form.control}
                        disabled={disabled}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>

                                <FormControl>
                                    <Select
                                        placeholder="Select a category"
                                        options={categoryOptions}
                                        onCreate={onCreateCategory}
                                        value={field.value}
                                        onChange={field.onChange}
                                        disabled={disabled}
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        name="accountId"
                        control={form.control}
                        disabled={disabled}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Account</FormLabel>

                                <FormControl>
                                    <Select
                                        placeholder="Select an account"
                                        options={accountOptions}
                                        onCreate={onCreateAccount}
                                        value={field.value}
                                        onChange={field.onChange}
                                        disabled={disabled}
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    name="date"
                    control={form.control}
                    disabled={disabled}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                                {onlyDate ? (
                                    <DatePicker
                                        value={field.value}
                                        onChange={field.onChange}
                                        disabled={disabled}
                                    />
                                ) : (
                                    <DateTimePicker
                                        value={field.value}
                                        onChange={field.onChange}
                                        disabled={disabled}
                                    />
                                )}
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    name="notes"
                    control={form.control}
                    disabled={disabled}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notes</FormLabel>

                            <FormControl>
                                <Textarea
                                    {...field}
                                    value={field.value || ''}
                                    disabled={disabled}
                                    placeholder="Anything worth remembering (optional)"
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-2 pt-2">
                    <Button className="w-full" size="lg" disabled={disabled}>
                        {id ? 'Save changes' : 'Add transaction'}
                    </Button>

                    {!!id && (
                        <Button
                            type="button"
                            disabled={disabled}
                            onClick={handleDelete}
                            className="w-full"
                            variant="destructive-ghost"
                        >
                            <Trash2 className="size-4" />
                            Delete transaction
                        </Button>
                    )}
                </div>
            </form>
        </Form>
    )
}
