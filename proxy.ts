import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
    '/',
    '/transactions(.*)',
    '/accounts(.*)',
    '/categories(.*)',
    '/settings(.*)',
])

export const proxy = clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) await auth.protect()

    return NextResponse.next()
})

export const config = {
    // Skip Next internals and static files (manifest, icons, service worker),
    // so Clerk never redirects a PWA asset request to its handshake.
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
