'use client'

import { useMountedState } from 'react-use'
import { EditAccountSheet } from '@/features/accounts/components/edit-account-sheet'
import { NewAccountSheet } from '@/features/accounts/components/new-account-sheet'
import { NewCategorySheet } from '@/features/categories/components/new-category-sheet'
import { EditCategorySheet } from '@/features/categories/components/edit-category-sheet'
import { NewTransactionSheet } from '@/features/transactions/components/new-transaction-sheet'
import { EditTransactionSheet } from '@/features/transactions/components/edit-transaction-sheet'
import { ContributionSheet } from '@/features/goals/components/contribution-sheet'
import { GoalSheet } from '@/features/goals/components/goal-sheet'
import { PeriodSheet } from '@/features/goals/components/period-sheet'
export const SheetProvider = () => {
    const isMounted = useMountedState()

    if (!isMounted) return null

    return (
        <>
            <EditAccountSheet /> <NewAccountSheet />
            <NewCategorySheet /> <EditCategorySheet />
            <EditTransactionSheet />
            <NewTransactionSheet />
            <GoalSheet />
            <PeriodSheet />
            <ContributionSheet />
        </>
    )
}
