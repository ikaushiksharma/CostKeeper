import { create } from 'zustand'

type ContributionSheetState = {
    isOpen: boolean
    goalId?: string
    onOpen: (goalId: string) => void
    onClose: () => void
}

export const useContributionSheet = create<ContributionSheetState>((set) => ({
    isOpen: false,
    onOpen: (goalId) => set({ isOpen: true, goalId }),
    onClose: () => set({ isOpen: false, goalId: undefined }),
}))
