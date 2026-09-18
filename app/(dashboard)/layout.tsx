import type { PropsWithChildren } from 'react'
import { Suspense } from 'react'

import { Header } from '@/components/header'

const DashboardLayout = ({ children }: PropsWithChildren) => {
    return (
        <>
            <Header />
            <main className="px-3 lg:px-14">
                {/* Dashboard pages read useSearchParams(); the boundary keeps them
                    prerenderable now that Clerk no longer forces dynamic rendering. */}
                <Suspense>{children}</Suspense>
            </main>
        </>
    )
}

export default DashboardLayout
