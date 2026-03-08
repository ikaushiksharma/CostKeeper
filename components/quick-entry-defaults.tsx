'use client'

import { Settings2, Loader2 } from 'lucide-react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/select'
import { useGetAccounts } from '@/features/accounts/api/use-get-accounts'
import { useGetCategories } from '@/features/categories/api/use-get-categories'
import { useGetSettings } from '@/features/settings/api/use-get-settings'
import { useUpdateSettings } from '@/features/settings/api/use-update-settings'

export function QuickEntryDefaults() {
    const accountsQuery = useGetAccounts()
    const categoriesQuery = useGetCategories()
    const settingsQuery = useGetSettings()
    const updateSettingsMutation = useUpdateSettings()

    const accountOptions = (accountsQuery.data ?? []).map((account) => ({
        label: account.name,
        value: account.id,
    }))

    const categoryOptions = (categoriesQuery.data ?? []).map((category) => ({
        label: category.name,
        value: category.id,
    }))

    const isLoading =
        settingsQuery.isLoading ||
        accountsQuery.isLoading ||
        categoriesQuery.isLoading
    const isPending = updateSettingsMutation.isPending

    return (
        <Card className="border-none drop-shadow-sm mt-6">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Settings2 className="size-5 text-blue-500" />
                    <CardTitle className="text-xl">
                        Transaction Defaults
                    </CardTitle>
                </div>
                <CardDescription>
                    Set default account and category for new transactions
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            These defaults are used when adding transactions via
                            Quick Add on the homepage or the Telegram bot. If
                            not specified in your message, these will be used
                            automatically.
                        </p>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="default-account">
                                    Default Account
                                </Label>
                                <Select
                                    value={settingsQuery.data?.defaultAccountId}
                                    onChange={(value) => {
                                        updateSettingsMutation.mutate({
                                            defaultAccountId: value || null,
                                        })
                                    }}
                                    options={accountOptions}
                                    placeholder="Select account..."
                                    disabled={isPending}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="default-category">
                                    Default Category
                                </Label>
                                <Select
                                    value={
                                        settingsQuery.data?.defaultCategoryId
                                    }
                                    onChange={(value) => {
                                        updateSettingsMutation.mutate({
                                            defaultCategoryId: value || null,
                                        })
                                    }}
                                    options={categoryOptions}
                                    placeholder="Select category..."
                                    disabled={isPending}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
