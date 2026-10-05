import { ClerkLoaded, ClerkLoading, UserButton } from '@clerk/nextjs'
import { Github } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { links } from '@/config'
import { Logo } from './logo'
import { Navigation } from './navigation'
import { ThemeToggle } from './theme-toggle'

export const Header = () => {
    return (
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
            <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4 px-4 lg:px-8">
                <div className="flex items-center gap-8">
                    <Logo />
                    <Navigation />
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="hidden sm:inline-flex rounded-full size-9"
                    >
                        <Link
                            href={links.sourceCode}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label="Source code on GitHub"
                        >
                            <Github className="size-[18px]" />
                        </Link>
                    </Button>

                    <ThemeToggle />

                    <div className="ml-1 flex size-8 items-center justify-center">
                        <ClerkLoaded>
                            <UserButton />
                        </ClerkLoaded>
                        <ClerkLoading>
                            <Skeleton className="size-7 rounded-full" />
                        </ClerkLoading>
                    </div>
                </div>
            </div>
        </header>
    )
}
