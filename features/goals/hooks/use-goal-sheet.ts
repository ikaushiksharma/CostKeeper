import { create } from 'zustand'

// Create (no id) or edit (id) a goal.
type GoalSheetState = {
    isOpen: boolean
    id?: string
    onOpen: (id?: string) => void
    onClose: () => void
}

export const useGoalSheet = create<GoalSheetState>((set) => ({
    isOpen: false,
    id: undefined,
    onOpen: (id) => set({ isOpen: true, id }),
    onClose: () => set({ isOpen: false, id: undefined }),
}))
