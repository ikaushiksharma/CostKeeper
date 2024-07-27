export {}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            // neon db url
            DATABASE_URL: string
            NEXT_PUBLIC_APP_URL: string
        }
    }
}
