import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import type { PropsWithChildren } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { SerwistProvider } from '@serwist/turbopack/react'
import { QueryProviders } from '@/providers/query-provider'
import { SheetProvider } from '@/providers/sheet-provider'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { siteConfig } from '@/config'
import { cn } from '@/lib/utils'
import { ThemeProvider } from '@/providers/theme-provider'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({
    subsets: ['latin'],
    variable: '--font-geist-mono',
})

export const viewport: Viewport = {
    // Lets the mobile tab bar pad itself with env(safe-area-inset-bottom).
    viewportFit: 'cover',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#f7f7f8' },
        { media: '(prefers-color-scheme: dark)', color: '#0c0c0e' },
    ],
}

export const metadata: Metadata = siteConfig

const RootLayout = ({ children }: Readonly<PropsWithChildren>) => {
    return (
        <ClerkProvider>
            {/* next-themes writes the theme class on <html> before hydration. */}
            <html lang="en-IN" suppressHydrationWarning>
                <body
                    className={cn(
                        geistSans.variable,
                        geistMono.variable,
                        'font-sans'
                    )}
                >
                    <SerwistProvider
                        swUrl="/serwist/sw.js"
                        cacheOnNavigation
                        reloadOnOnline
                    >
                        <QueryProviders>
                            <ThemeProvider
                                attribute="class"
                                defaultTheme="system"
                                enableSystem
                                disableTransitionOnChange
                            >
                                <SheetProvider />
                                <Toaster richColors position="top-center" />
                                {children}
                            </ThemeProvider>
                        </QueryProviders>
                    </SerwistProvider>
                </body>
            </html>
        </ClerkProvider>
    )
}

export default RootLayout
