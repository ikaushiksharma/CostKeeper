import React from 'react'

const OfflinePage = () => {
    return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-md text-center">
                <div className="mx-auto h-12 w-12 text-primary" />
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    You are offline
                </h1>
                <p className="mt-4 text-muted-foreground">
                    Please check your internet connection and try again.
                </p>
            </div>
        </div>
    )
}

export default OfflinePage
