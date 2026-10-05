'use client'

import { useUser } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'

import { Skeleton } from '@/components/ui/skeleton'
import { Filters } from './filters'

const pages: Record<string, { title: string; description: string }> = {
    '/transactions': {
        title: 'Transactions',
        description: 'Every entry in one place. Search, sort and edit.',
    },
    '/goals': {
        title: 'Goals',
        description: 'Targets you are working toward, period by period.',
    },
    '/accounts': {
        title: 'Accounts',
        description: 'Where your money lives: bank, cash and cards.',
    },
    '/categories': {
        title: 'Categories',
        description: 'Group spending so patterns are easy to spot.',
    },
    '/settings': {
        title: 'Settings',
        description: 'Defaults, preferences and integrations.',
    },
}

const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
}

const OverviewTitle = () => {
    const { user, isLoaded } = useUser()

    if (!isLoaded) return <Skeleton className="h-8 w-64" />

    const name = user?.firstName
    return <>{name ? `${greeting()}, ${name}` : greeting()}</>
}

export const PageHeader = () => {
    const pathname = usePathname()
    // Longest matching prefix, so /goals/<id> still gets the Goals header.
    const page =
        pages[pathname] ??
        Object.entries(pages)
            .filter(([path]) => pathname.startsWith(`${path}/`))
            .sort(([a], [b]) => b.length - a.length)[0]?.[1]
    const isOverview = pathname === '/'

    return (
        <div className="flex flex-col gap-4 pt-6 pb-6 lg:pt-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1.5">
                <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">
                    {isOverview ? <OverviewTitle /> : page?.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {isOverview
                        ? "Here's how your money moved in this period."
                        : page?.description}
                </p>
            </div>
            <Filters />
        </div>
    )
}
