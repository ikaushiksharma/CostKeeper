'use client'

import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    arrayMove,
    rectSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { cn } from '@/lib/utils'
import type { Goal } from '../api/shared'
import { GoalCard } from './goal-card'

const SortableGoal = ({ goal }: { goal: Goal }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: goal.id })

    return (
        // biome-ignore lint/a11y/useSemanticElements: the card holds block content, which a <button> cannot contain.
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
            {...attributes}
            {...listeners}
            // dnd-kit sets these too; stated here so the a11y lint can see them.
            role="button"
            tabIndex={0}
            aria-label={`${goal.name}. Press space to pick up, arrow keys to move, space to drop.`}
            className={cn(
                'relative cursor-grab touch-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing',
                isDragging && 'z-10 opacity-90 shadow-xl'
            )}
        >
            <GoalCard goal={goal} reordering />
        </div>
    )
}

type SortableGoalGridProps = {
    goals: Goal[]
    onReorder: (ids: string[]) => void
}

// Drag cards to reorder (mouse, touch, or keyboard).
export const SortableGoalGrid = ({
    goals,
    onReorder,
}: SortableGoalGridProps) => {
    const sensors = useSensors(
        // Small movement threshold so a tap is not mistaken for a drag.
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 150, tolerance: 6 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const ids = goals.map((g) => g.id)

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return
        const from = ids.indexOf(String(active.id))
        const to = ids.indexOf(String(over.id))
        onReorder(arrayMove(ids, from, to))
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={ids} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {goals.map((goal) => (
                        <SortableGoal key={goal.id} goal={goal} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}
