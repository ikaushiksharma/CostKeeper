import { ClerkLoaded, ClerkLoading } from '@clerk/nextjs'
import type { ReactNode } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { LogoMark } from './logo'

type AuthShellProps = {
    title: string
    description: string
    children: ReactNode
}

export const AuthShell = ({ title, description, children }: AuthShellProps) => (
    <div className="grid min-h-[100dvh] grid-cols-1 lg:grid-cols-[1fr_minmax(0,560px)]">
        <div className="flex flex-col px-4 py-8 sm:px-8">
            <div className="flex items-center gap-2.5">
                <LogoMark />
                <span className="text-[17px] font-semibold tracking-tight">
                    CostKeeper
                </span>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-8 py-10">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight">
                        {title}
                    </h1>
                    <p className="text-muted-foreground">{description}</p>
                </div>

                <ClerkLoaded>{children}</ClerkLoaded>
                <ClerkLoading>
                    <Skeleton className="h-[420px] w-full max-w-[400px] rounded-xl" />
                </ClerkLoading>
            </div>
        </div>

        <aside className="relative hidden overflow-hidden bg-zinc-950 text-zinc-50 lg:flex lg:flex-col lg:justify-between lg:p-12">
            <div
                aria-hidden
                className="absolute -right-40 -top-40 size-[520px] rounded-full border border-white/10"
            />
            <div
                aria-hidden
                className="absolute -right-40 top-[220px] h-[260px] w-[520px] rounded-b-full bg-emerald-500/15"
            />
            <div
                aria-hidden
                className="absolute -right-56 top-[218px] h-px w-[760px] bg-white/20"
            />

            <p className="relative text-sm text-zinc-400">
                Income, expenses, accounts and categories in one ledger.
            </p>

            <div className="relative space-y-4">
                <p className="max-w-[16ch] text-4xl font-semibold leading-[1.1] tracking-tight">
                    Know where every rupee goes.
                </p>
                <p className="max-w-[42ch] text-zinc-400">
                    Type a sentence like &ldquo;Auto 85 from Cash&rdquo; and
                    CostKeeper files it for you.
                </p>
            </div>
        </aside>
    </div>
)
