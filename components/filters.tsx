'use client'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { AccountFilter } from './account-filter'
import { DateFilter } from './date-filter'
import { Skeleton } from './ui/skeleton'

const FiltersContent = () => (
    <div className="flex flex-col sm:flex-row items-stretch gap-2">
        <AccountFilter />
        <DateFilter />
    </div>
)

const FiltersFallback = () => (
    <div className="flex flex-col sm:flex-row items-stretch gap-2">
        <Skeleton className="h-10 w-full sm:w-40" />
        <Skeleton className="h-10 w-full sm:w-64" />
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
