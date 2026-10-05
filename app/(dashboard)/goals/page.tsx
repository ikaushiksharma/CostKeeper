'use client'

import { ArrowUpDown, Check, Plus, Target } from 'lucide-react'
import { useEffect, useState } from 'react'

import { EmptyState } from '@/components/empty-state'
import { Segmented } from '@/components/segmented'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Goal } from '@/features/goals/api/shared'
import { useGetGoals } from '@/features/goals/api/use-get-goals'
import { useReorderGoals } from '@/features/goals/api/use-reorder-goals'
import { GoalCard } from '@/features/goals/components/goal-card'
import { GoalsStats } from '@/features/goals/components/goal-stats'
import { SortableGoalGrid } from '@/features/goals/components/sortable-goal-grid'
import { useGoalSheet } from '@/features/goals/hooks/use-goal-sheet'

type Tab = 'active' | 'paused' | 'archived'

const EMPTY_COPY: Record<Tab, { title: string; description: string }> = {
    active: {
        title: 'No goals yet',
        description:
            'Set a target for a half-year or a year, like an SIP plan, a loan or a trip budget, and log what you put toward it.',
    },
    paused: {
        title: 'Nothing paused',
        description:
            'Paused goals keep their history but drop out of your active list.',
    },
    archived: {
        title: 'Nothing archived',
        description: 'Finished or retired goals land here.',
    },
}

const GoalsPage = () => {
    const [tab, setTab] = useState<Tab>('active')
    const goalsQuery = useGetGoals(tab)
    // Stats cover every goal, archived ones included, so history is kept.
    const allGoalsQuery = useGetGoals('all')
    const goalSheet = useGoalSheet()
    const reorderMutation = useReorderGoals()
    const [reordering, setReordering] = useState(false)
    // Local order while reordering, so cards move instantly; cleared when
    // fresh data arrives from the server.
    const [order, setOrder] = useState<string[] | null>(null)
    // biome-ignore lint/correctness/useExhaustiveDependencies: reset the optimistic order whenever the server list changes.
    useEffect(() => setOrder(null), [goalsQuery.data])

    const fetched = goalsQuery.data ?? []
    const goals = order
        ? order
              .map((id) => fetched.find((g) => g.id === id))
              .filter((g): g is Goal => !!g)
        : fetched

    const changeTab = (next: Tab) => {
        setTab(next)
        setReordering(false)
    }

    const handleReorder = (ids: string[]) => {
        setOrder(ids)
        reorderMutation.mutate(ids)
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Segmented
                    label="Goal status"
                    value={tab}
                    onChange={changeTab}
                    options={[
                        { value: 'active', label: 'Active' },
                        { value: 'paused', label: 'Paused' },
                        { value: 'archived', label: 'Archived' },
                    ]}
                    className="w-full sm:w-auto"
                />
                <div className="flex items-center gap-2">
                    {fetched.length > 1 && (
                        <Button
                            size="sm"
                            variant={reordering ? 'default' : 'outline'}
                            onClick={() => setReordering((r) => !r)}
                            aria-pressed={reordering}
                        >
                            {reordering ? (
                                <>
                                    <Check className="size-4" /> Done
                                </>
                            ) : (
                                <>
                                    <ArrowUpDown className="size-4" /> Reorder
                                </>
                            )}
                        </Button>
                    )}
                    {!reordering && (
                        <Button size="sm" onClick={() => goalSheet.onOpen()}>
                            <Plus className="size-4" /> New goal
                        </Button>
                    )}
                </div>
            </div>

            {reordering && (
                <p className="text-sm text-muted-foreground">
                    Drag the cards into the order you want. With a keyboard,
                    focus a card, press space, move it with the arrow keys and
                    press space again.
                </p>
            )}

            {goalsQuery.isLoading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                        <Card key={i} className="space-y-5 p-5">
                            <div className="flex justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                            <Skeleton className="h-7 w-36" />
                            <Skeleton className="h-2 w-full rounded-full" />
                            <Skeleton className="h-3 w-48" />
                        </Card>
                    ))}
                </div>
            ) : goals.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={Target}
                        title={EMPTY_COPY[tab].title}
                        description={EMPTY_COPY[tab].description}
                        className="py-16"
                        action={
                            tab === 'active' && (
                                <Button
                                    size="sm"
                                    onClick={() => goalSheet.onOpen()}
                                >
                                    <Plus className="size-4" /> New goal
                                </Button>
                            )
                        }
                    />
                </Card>
            ) : reordering ? (
                <SortableGoalGrid goals={goals} onReorder={handleReorder} />
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {goals.map((goal) => (
                        <GoalCard key={goal.id} goal={goal} />
                    ))}
                </div>
            )}

            {(allGoalsQuery.data?.length ?? 0) > 0 && (
                <GoalsStats goals={allGoalsQuery.data ?? []} />
            )}
        </div>
    )
}

export default GoalsPage
