'use client'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { AccountFilter } from './account-filter'
import { DateFilter } from './date-filter'
import { Skeleton } from './ui/skeleton'

const FiltersContent = () => (
    <div className="flex flex-col lg:flex-row items-center gap-y-2 lg:gap-y-0 lg:gap-x-2">
        <AccountFilter />
        <DateFilter />
    </div>
)

const FiltersFallback = () => (
    <div className="flex flex-col lg:flex-row items-center gap-y-2 lg:gap-y-0 lg:gap-x-2">
        <Skeleton className="h-9 w-full lg:w-auto lg:min-w-[120px]" />
        <Skeleton className="h-9 w-full lg:w-auto lg:min-w-[200px]" />
    </div>
)

export const Filters = () => {
    const pathname = usePathname()
    if (pathname === '/' || pathname === '/transactions')
        // AccountFilter/DateFilter read useSearchParams(), which needs a Suspense
        // boundary to avoid bailing the whole route out of prerendering.
        return (
            <Suspense fallback={<FiltersFallback />}>
                <FiltersContent />
            </Suspense>
        )
    return null
}
