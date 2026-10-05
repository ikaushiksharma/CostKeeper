'use client'

import { Skeleton } from '@/components/ui/skeleton'
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
    const portalTarget = typeof document !== 'undefined' ? document.body : null

    return (
        <Card>
            <CardHeader>
                <CardTitle>Transaction defaults</CardTitle>
                <CardDescription>
                    Used by Quick Add, the Telegram bot and the new transaction
                    form whenever you don&apos;t say otherwise.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                    </div>
                ) : (
                    <div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Default account</Label>
                                <Select
                                    menuPortalTarget={portalTarget}
                                    value={settingsQuery.data?.defaultAccountId}
                                    onChange={(value) => {
                                        updateSettingsMutation.mutate({
                                            defaultAccountId: value || null,
                                        })
                                    }}
                                    options={accountOptions}
                                    placeholder="None"
                                    disabled={isPending}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Default category</Label>
                                <Select
                                    menuPortalTarget={portalTarget}
                                    value={
                                        settingsQuery.data?.defaultCategoryId
                                    }
                                    onChange={(value) => {
                                        updateSettingsMutation.mutate({
                                            defaultCategoryId: value || null,
                                        })
                                    }}
                                    options={categoryOptions}
                                    placeholder="None"
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
