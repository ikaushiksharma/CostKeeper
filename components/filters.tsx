'use client'
import { AccountFilter } from './account-filter'
import { DateFilter } from './date-filter'
import { usePathname } from 'next/navigation'

export const Filters = () => {
    const pathname = usePathname()
    if (pathname === '/' || pathname === '/transactions')
        return (
            <div className="flex flex-col lg:flex-row items-center gap-y-2 lg:gap-y-0 lg:gap-x-2">
                <AccountFilter />
                <DateFilter />
            </div>
        )
    return null
}
