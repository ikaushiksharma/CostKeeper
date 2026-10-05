'use client'

import { Plus, Shapes } from 'lucide-react'

import { DataTable } from '@/components/data-table'
import { EmptyState } from '@/components/empty-state'
import { ListCard, ListCardSkeleton } from '@/components/list-card'
import { Button } from '@/components/ui/button'
import { useBulkDeleteCategories } from '@/features/categories/api/use-bulk-delete-categories'
import { useGetCategories } from '@/features/categories/api/use-get-categories'
import { useNewCategory } from '@/features/categories/hooks/use-new-category'

import { columns } from './columns'

const CategoriesPage = () => {
    const newCategory = useNewCategory()
    const deleteCategories = useBulkDeleteCategories()
    const categoriesQuery = useGetCategories()
    const categories = categoriesQuery.data || []

    const isDisabled = categoriesQuery.isLoading || deleteCategories.isPending

    if (categoriesQuery.isLoading) {
        return <ListCardSkeleton rows={6} />
    }

    return (
        <ListCard
            title="Your categories"
            count={categories.length}
            actions={
                <Button size="sm" onClick={newCategory.onOpen}>
                    <Plus className="size-4" /> New category
                </Button>
            }
        >
            <DataTable
                filterKey="name"
                filterPlaceholder="Search categories"
                columns={columns}
                data={categories}
                onDelete={(row) => {
                    const ids = row.map((r) => r.original.id)

                    deleteCategories.mutate({ ids })
                }}
                disabled={isDisabled}
                emptyState={
                    <EmptyState
                        icon={Shapes}
                        title="No categories yet"
                        description="Create a few, like Food, Rent or Travel, to see where your money goes."
                        action={
                            <Button size="sm" onClick={newCategory.onOpen}>
                                <Plus className="size-4" /> New category
                            </Button>
                        }
                    />
                }
            />
        </ListCard>
    )
}

export default CategoriesPage
