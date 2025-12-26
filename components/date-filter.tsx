'use client'

import { format, startOfMonth } from 'date-fns'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import qs from 'query-string'

import { DateRangePicker } from '@/components/ui/date-range-picker'

export const DateFilter = () => {
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()

    const accountId = searchParams.get('accountId')
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''

    const defaultTo = new Date()
    const defaultFrom = startOfMonth(defaultTo)

    const handleUpdate = ({
        range,
    }: {
        range: { from: Date; to: Date | undefined }
    }) => {
        const query = {
            from: format(range.from || defaultFrom, 'yyyy-MM-dd'),
            to: format(range.to || defaultTo, 'yyyy-MM-dd'),
            accountId,
        }

        const url = qs.stringifyUrl(
            {
                url: pathname,
                query,
            },
            { skipEmptyString: true, skipNull: true }
        )

        router.push(url)
    }

    return (
        <DateRangePicker
            initialDateFrom={from ? new Date(from) : defaultFrom}
            initialDateTo={to ? new Date(to) : defaultTo}
            onUpdate={handleUpdate}
            align="start"
            showCompare={false}
        />
    )
}
