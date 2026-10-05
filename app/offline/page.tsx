import { WifiOff } from 'lucide-react'

import { LogoMark } from '@/components/logo'

const OfflinePage = () => {
    return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12">
            <div className="mx-auto flex max-w-sm flex-col items-center text-center">
                <LogoMark className="size-10" />
                <div className="mt-8 flex size-11 items-center justify-center rounded-full bg-muted">
                    <WifiOff className="size-5 text-muted-foreground" />
                </div>
                <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                    You&apos;re offline
                </h1>
                <p className="mt-2 text-muted-foreground">
                    CostKeeper needs a connection to load your data. Check your
                    network and try again.
                </p>
                <a
                    href="/"
                    className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    Try again
                </a>
            </div>
        </div>
    )
}

export default OfflinePage
