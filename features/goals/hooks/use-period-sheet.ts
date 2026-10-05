import { create } from 'zustand'

// Add the next period (no periodId) or edit one.
type PeriodSheetState = {
    isOpen: boolean
    goalId?: string
    periodId?: string
    onOpen: (goalId: string, periodId?: string) => void
    onClose: () => void
}

export const usePeriodSheet = create<PeriodSheetState>((set) => ({
    isOpen: false,
    onOpen: (goalId, periodId) => set({ isOpen: true, goalId, periodId }),
    onClose: () =>
        set({ isOpen: false, goalId: undefined, periodId: undefined }),
}))
