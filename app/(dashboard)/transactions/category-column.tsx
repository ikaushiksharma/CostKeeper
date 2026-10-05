import { TriangleAlert } from 'lucide-react'

import { useOpenCategory } from '@/features/categories/hooks/use-open-category'
import { cn } from '@/lib/utils'
import { useOpenTransaction } from '@/features/transactions/hooks/use-open-transaction'

type CategoryColumnProps = {
    id: string
    category: string | null
    categoryId: string | null
}

export const CategoryColumn = ({
    id,
    category,
    categoryId,
}: CategoryColumnProps) => {
    const { onOpen: onOpenCategory } = useOpenCategory()
    const { onOpen: onOpenTransaction } = useOpenTransaction()

    const onClick = () => {
        if (categoryId) onOpenCategory(categoryId)
        else onOpenTransaction(id)
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                !category &&
                    'border-expense/30 bg-expense/5 text-expense hover:bg-expense/10'
            )}
            title={category ? `Edit ${category}` : 'Assign a category'}
        >
            {!category && <TriangleAlert className="size-3.5 shrink-0" />}
            {category || 'Uncategorized'}
        </button>
    )
}
