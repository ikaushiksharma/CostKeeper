'use client'

import {
    ArrowLeftRight,
    LayoutGrid,
    type LucideIcon,
    Settings,
    Shapes,
    Target,
    WalletCards,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

type Route = {
    href: string
    label: string
    icon: LucideIcon
    // The mobile tab bar has room for five; Categories stays reachable from
    // the Accounts page there.
    mobile?: boolean
}

export const routes: Route[] = [
    { href: '/', label: 'Overview', icon: LayoutGrid },
    { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
    { href: '/goals', label: 'Goals', icon: Target },
    { href: '/accounts', label: 'Accounts', icon: WalletCards },
    { href: '/categories', label: 'Categories', icon: Shapes, mobile: false },
    { href: '/settings', label: 'Settings', icon: Settings },
]

const isActiveRoute = (pathname: string, href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

// Desktop: inline pill nav inside the top bar. Rendered with CSS breakpoints
// (not a JS media query) so there is no layout flash on first paint.
export const Navigation = () => {
    const pathname = usePathname()

    return (
        <nav aria-label="Main" className="hidden md:flex items-center gap-1">
            {routes.map((route) => {
                const active = isActiveRoute(pathname, route.href)
                return (
                    <Link
                        key={route.href}
                        href={route.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                            'h-9 rounded-full px-3.5 inline-flex items-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            active
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                    >
                        {route.label}
                    </Link>
                )
            })}
        </nav>
    )
}

// Mobile: fixed bottom tab bar, every destination one thumb-tap away.
export const MobileNavigation = () => {
    const pathname = usePathname()

    return (
        <nav
            aria-label="Main"
            className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]"
        >
            <ul className="grid grid-cols-5">
                {routes
                    .filter((route) => route.mobile !== false)
                    .map((route) => {
                        const active = isActiveRoute(pathname, route.href)
                        const Icon = route.icon
                        return (
                            <li key={route.href}>
                                <Link
                                    href={route.href}
                                    aria-current={active ? 'page' : undefined}
                                    className={cn(
                                        'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                                        active
                                            ? 'text-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                                            active && 'bg-brand-soft text-brand'
                                        )}
                                    >
                                        <Icon
                                            className="size-[18px]"
                                            strokeWidth={2}
                                        />
                                    </span>
                                    {route.label}
                                </Link>
                            </li>
                        )
                    })}
            </ul>
        </nav>
    )
}
