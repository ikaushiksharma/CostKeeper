'use client'

import { Clock } from 'lucide-react'
import { useId } from 'react'

import { QuickEntryDefaults } from '@/components/quick-entry-defaults'
import { TelegramSettings } from '@/components/telegram-settings'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useGetSettings } from '@/features/settings/api/use-get-settings'
import { useUpdateSettings } from '@/features/settings/api/use-update-settings'

const PreferencesCard = () => {
    const switchId = useId()
    const settingsQuery = useGetSettings()
    const updateMutation = useUpdateSettings()

    return (
        <Card>
            <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                    Changes save as soon as you make them.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-start justify-between gap-4 rounded-md border p-4">
                    <div className="flex gap-3">
                        <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="space-y-1">
                            <Label htmlFor={switchId}>
                                Record the time too
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Show a time picker next to the date when adding
                                or editing a transaction.
                            </p>
                        </div>
                    </div>
                    {settingsQuery.isLoading ? (
                        <Skeleton className="h-6 w-11 rounded-full" />
                    ) : (
                        <Switch
                            id={switchId}
                            checked={
                                // Reflect the pending value right away instead of
                                // snapping back until the refetch lands.
                                updateMutation.isPending &&
                                updateMutation.variables?.dateTimeMode !==
                                    undefined
                                    ? !!updateMutation.variables.dateTimeMode
                                    : !!settingsQuery.data?.dateTimeMode
                            }
                            disabled={updateMutation.isPending}
                            onCheckedChange={(checked) =>
                                updateMutation.mutate({ dateTimeMode: checked })
                            }
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

const Page = () => {
    return (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-6">
            <div className="space-y-4 lg:space-y-6">
                <PreferencesCard />
                <QuickEntryDefaults />
            </div>
            <TelegramSettings />
        </div>
    )
}

export default Page
