import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/'])

export const proxy = clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) await auth.protect()

    return NextResponse.next()
})

export const config = {
    matcher: ['/((?!.+.[w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
