const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

interface TelegramMessage {
    message_id: number
    from: {
        id: number
        username?: string
        first_name?: string
        last_name?: string
    }
    chat: {
        id: number
        type: string
    }
    text?: string
    date: number
}

interface TelegramCallbackQuery {
    id: string
    from: {
        id: number
        username?: string
        first_name?: string
        last_name?: string
    }
    message?: TelegramMessage
    data?: string
}

interface TelegramUpdate {
    update_id: number
    message?: TelegramMessage
    callback_query?: TelegramCallbackQuery
}

export interface TelegramUserInfo {
    id: number
    username?: string
    firstName?: string
    lastName?: string
}

export function parseUpdate(body: unknown): TelegramUpdate | null {
    if (!body || typeof body !== 'object') return null
    return body as TelegramUpdate
}

export function extractUserInfo(message: TelegramMessage): TelegramUserInfo {
    return {
        id: message.from.id,
        username: message.from.username,
        firstName: message.from.first_name,
        lastName: message.from.last_name,
    }
}

export async function sendMessage(
    chatId: number,
    text: string,
    options?: {
        parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
        replyMarkup?: object
    }
): Promise<boolean> {
    try {
        const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: options?.parseMode,
                reply_markup: options?.replyMarkup,
            }),
        })
        return response.ok
    } catch (error) {
        console.error('Error sending Telegram message:', error)
        return false
    }
}

export async function sendInlineKeyboard(
    chatId: number,
    text: string,
    buttons: Array<Array<{ text: string; callback_data: string }>>
): Promise<boolean> {
    return sendMessage(chatId, text, {
        replyMarkup: {
            inline_keyboard: buttons,
        },
    })
}

export async function setWebhook(webhookUrl: string): Promise<boolean> {
    try {
        const response = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: webhookUrl,
                allowed_updates: ['message', 'callback_query'],
            }),
        })
        const data = await response.json()
        console.log('Webhook set response:', data)
        return response.ok
    } catch (error) {
        console.error('Error setting webhook:', error)
        return false
    }
}

export async function deleteWebhook(): Promise<boolean> {
    try {
        const response = await fetch(`${TELEGRAM_API_URL}/deleteWebhook`, {
            method: 'POST',
        })
        return response.ok
    } catch (error) {
        console.error('Error deleting webhook:', error)
        return false
    }
}

export function formatAmount(amountInCents: number): string {
    const amount = Math.abs(amountInCents / 100)
    const sign = amountInCents < 0 ? '-' : '+'
    return `${sign}Rs. ${amount.toFixed(2)}`
}

export function escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')
}

export async function answerCallbackQuery(
    callbackQueryId: string,
    options?: {
        text?: string
        showAlert?: boolean
    }
): Promise<boolean> {
    try {
        const response = await fetch(
            `${TELEGRAM_API_URL}/answerCallbackQuery`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    callback_query_id: callbackQueryId,
                    text: options?.text,
                    show_alert: options?.showAlert,
                }),
            }
        )
        return response.ok
    } catch (error) {
        console.error('Error answering callback query:', error)
        return false
    }
}

export type { TelegramCallbackQuery }
