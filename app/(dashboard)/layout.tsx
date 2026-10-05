import type { PropsWithChildren } from 'react'
import { Suspense } from 'react'

import { Header } from '@/components/header'
import { MobileNavigation } from '@/components/navigation'
import { PageHeader } from '@/components/page-header'

const DashboardLayout = ({ children }: PropsWithChildren) => {
    return (
        <>
            <Header />
            <main className="mx-auto w-full max-w-screen-2xl px-4 pb-28 md:pb-12 lg:px-8">
                {/* Dashboard pages read useSearchParams(); the boundary keeps them
                    prerenderable now that Clerk no longer forces dynamic rendering. */}
                <Suspense>
                    <PageHeader />
                    {children}
                </Suspense>
            </main>
            <MobileNavigation />
        </>
    )
}

export default DashboardLayout
