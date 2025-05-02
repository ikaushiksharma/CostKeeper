'use client'

import { useUser } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'

export const WelcomeMsg = () => {
    const { user, isLoaded } = useUser()

    const pathname = usePathname()

    const getPageMsg = () => {
        switch (pathname) {
            case '/':
                return 'Welcome to your financial dashboard! Track your spending, set budgets, and achieve your financial goals.'
            case '/transactions':
                return 'View and manage all your transactions in one place. Keep track of your income and expenses effortlessly.'
            case '/accounts':
                return 'Manage your bank accounts, credit cards, and other financial accounts. Stay on top of your balances.'
            case '/categories':
                return 'Organize your expenses by categories. Understand your spending patterns and identify areas to save.'
            case '/settings':
                return 'Customize your experience and manage your preferences to make Cost Keeper work best for you.'
            default:
                return 'Welcome to Cost Keeper - Your personal finance companion!'
        }
    }

    const getPageTitle = () => {
        switch (pathname) {
            case '/':
                return `Welcome back ${isLoaded ? ', ' + user?.firstName : ' '} 👋`
            case '/transactions':
                return 'Your Transactions'
            case '/accounts':
                return 'All Accounts'
            case '/categories':
                return 'All Categories'
            case '/settings':
                return 'Settings'
            default:
                return 'Welcome to Cost Keeper - Your personal finance companion!'
        }
    }
    return (
        <div className="space-y-2 mb-4">
            <h2 className="text-2xl lg:text-4xl text-white font-medium">
                {getPageTitle()}
            </h2>
            <p className="text-sm w-2/3 lg:text-base text-[#89B6FD]">
                {getPageMsg()}
            </p>
        </div>
    )
}
