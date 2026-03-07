export {}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            // neon db url
            DATABASE_URL: string
            NEXT_PUBLIC_APP_URL: string
            // Telegram Bot
            TELEGRAM_BOT_TOKEN: string
            // Gemini AI
            GEMINI_API_KEY: string
        }
    }
}
