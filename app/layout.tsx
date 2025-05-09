import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import type { PropsWithChildren } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { QueryProviders } from '@/providers/query-provider'
import { SheetProvider } from '@/providers/sheet-provider'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { siteConfig } from '@/config'
import { ThemeProvider } from '@/providers/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
    themeColor: '#3d82f6',
}

export const metadata: Metadata = siteConfig

const RootLayout = ({ children }: Readonly<PropsWithChildren>) => {
    return (
        <ClerkProvider>
            <html lang="en">
                <body className={inter.className}>
                    <QueryProviders>
                        <SheetProvider />
                        <Toaster richColors theme="light" />
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="system"
                            enableSystem
                            disableTransitionOnChange
                        >
                            {children}
                        </ThemeProvider>
                    </QueryProviders>
                </body>
            </html>
        </ClerkProvider>
    )
}

export default RootLayout
