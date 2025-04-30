'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import React, { useEffect } from 'react'
import { Loader2, SquarePen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Switch } from '@/components/ui/switch'
import { useGetSettings } from '@/features/settings/api/use-get-settings'
import { Skeleton } from '@/components/ui/skeleton'
import { useUpdateSettings } from '@/features/settings/api/use-update-settings'

const formSchema = z.object({
    dateTimeMode: z.boolean(),
})

type FormValues = z.input<typeof formSchema>

const Page = () => {
    const updateMutation = useUpdateSettings()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
    })
    const handleSubmit = (values: FormValues) => {
        updateMutation.mutate(values)
    }

    const settingsQuery = useGetSettings()
    const settings = settingsQuery.data

    const isDisabled = settingsQuery.isLoading

    useEffect(() => {
        if (settingsQuery.isSuccess)
            form.reset({ dateTimeMode: !!settings?.dateTimeMode })
    }, [settingsQuery.isSuccess])

    if (settingsQuery.isLoading) {
        return (
            <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-6">
                <Card className="border-none drop-shadow-sm">
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                    </CardHeader>

                    <CardContent>
                        <div className="h-[500px] w-full flex items-center justify-center">
                            <Loader2 className="size-6 text-slate-300 animate-spin" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-6">
            <Card className="border-none drop-shadow-sm">
                <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
                    <CardTitle className="text-xl line-clamp-1">
                        Update Your Preferences
                    </CardTitle>
                </CardHeader>
                <CardContent className="">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(handleSubmit)}
                            autoCapitalize="off"
                            autoComplete="off"
                            className="pt-4 space-y-4"
                        >
                            <div className="grid space-y-4 md:grid-cols-2 grid-cols-1">
                                <FormField
                                    disabled={isDisabled}
                                    name="dateTimeMode"
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                            <div className="space-y-0.5">
                                                <FormLabel>
                                                    Allow Select Date Time
                                                </FormLabel>
                                                <FormDescription>
                                                    Allow select date time for
                                                    transactions
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Button
                                size="sm"
                                className="ml-auto"
                                disabled={isDisabled}
                            >
                                <SquarePen className="size-4 mr-2" />
                                Update Preferences
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

export default Page
