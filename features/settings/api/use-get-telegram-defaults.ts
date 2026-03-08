import { useQuery } from '@tanstack/react-query'

import { client } from '@/lib/hono'

export const useGetTelegramStatus = () => {
    const query = useQuery({
        queryKey: ['telegram-status'],
        queryFn: async () => {
            const response = await client.api.telegram.status.$get()

            if (!response.ok)
                throw new Error('Failed to fetch telegram status.')

            const { data } = await response.json()

            return data
        },
    })

    return query
}

// Keep legacy export for backward compatibility
export const useGetTelegramDefaults = useGetTelegramStatus
