import { createId } from '@paralleldrive/cuid2'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '@/db/drizzle'
import { accounts, categories, telegramUsers, transactions } from '@/db/schema'
import { parseTransactionMessage } from '@/lib/gemini'
import {
    formatAmount,
    parseUpdate,
    sendMessage,
    sendInlineKeyboard,
    setWebhook,
} from '@/lib/telegram'

const HELP_MESSAGE = `🤑 *Cost Keeper Bot*

I help you track expenses right from Telegram\\!

*Commands:*
/start \\- Get started
/link <code> \\- Link your account
/status \\- Check your link status
/accounts \\- List your accounts
/categories \\- List your categories
/setdefaults \\- Set default account/category
/help \\- Show this message

*Add transactions:*
Just send me a message like:
• "Spent $50 on groceries"
• "Coffee at Starbucks $5\\.50"
• "Received $1000 salary"
• "Paid $200 for electricity bill"

I'll parse it and add it to your tracker\\!`

const app = new Hono()
    // Webhook endpoint for Telegram
    .post('/webhook', async (ctx) => {
        const body = await ctx.req.json()
        const update = parseUpdate(body)

        if (!update?.message?.text) {
            return ctx.json({ ok: true })
        }

        const { message } = update
        const chatId = message.chat.id
        const telegramId = message.from.id.toString()
        const text = message.text!.trim()

        // Handle commands
        if (text.startsWith('/')) {
            await handleCommand(chatId, telegramId, text, message.from.username)
            return ctx.json({ ok: true })
        }

        // Handle transaction message
        await handleTransactionMessage(chatId, telegramId, text)
        return ctx.json({ ok: true })
    })
    // Setup webhook (call this once to configure)
    .post('/setup', async (ctx) => {
        const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`
        const success = await setWebhook(webhookUrl)
        return ctx.json({ success, webhookUrl })
    })
    // Generate a link code for a user
    .post('/generate-link', async (ctx) => {
        // This endpoint should be called from your app with Clerk auth
        const { userId, telegramCode } = await ctx.req.json()

        if (!userId || !telegramCode) {
            return ctx.json({ error: 'Missing userId or telegramCode' }, 400)
        }

        // Store the code temporarily (in production, use Redis or similar)
        // For simplicity, we'll encode it in the code itself
        const linkCode = Buffer.from(
            JSON.stringify({ userId, exp: Date.now() + 10 * 60 * 1000 })
        ).toString('base64url')

        return ctx.json({ linkCode })
    })

async function handleCommand(
    chatId: number,
    telegramId: string,
    text: string,
    username?: string
) {
    const [command, ...args] = text.split(' ')

    switch (command.toLowerCase()) {
        case '/start':
            await sendMessage(chatId, HELP_MESSAGE, { parseMode: 'MarkdownV2' })
            break

        case '/help':
            await sendMessage(chatId, HELP_MESSAGE, { parseMode: 'MarkdownV2' })
            break

        case '/link':
            await handleLinkCommand(chatId, telegramId, args[0], username)
            break

        case '/status':
            await handleStatusCommand(chatId, telegramId)
            break

        case '/accounts':
            await handleAccountsCommand(chatId, telegramId)
            break

        case '/categories':
            await handleCategoriesCommand(chatId, telegramId)
            break

        case '/setdefaults':
            await handleSetDefaultsCommand(chatId, telegramId)
            break

        default:
            await sendMessage(
                chatId,
                "I don't recognize that command. Use /help to see available commands."
            )
    }
}

async function handleLinkCommand(
    chatId: number,
    telegramId: string,
    code: string | undefined,
    username?: string
) {
    if (!code) {
        await sendMessage(
            chatId,
            '🔗 To link your account:\n\n' +
                '1. Go to your Cost Keeper app\n' +
                '2. Navigate to Settings > Telegram\n' +
                '3. Click "Generate Link Code"\n' +
                '4. Send me: /link <your-code>'
        )
        return
    }

    try {
        // Decode and validate the link code
        const decoded = JSON.parse(
            Buffer.from(code, 'base64url').toString('utf-8')
        )

        if (decoded.exp < Date.now()) {
            await sendMessage(
                chatId,
                '❌ This link code has expired. Please generate a new one.'
            )
            return
        }

        const userId = decoded.userId

        // Check if already linked
        const existing = await db
            .select()
            .from(telegramUsers)
            .where(eq(telegramUsers.telegramId, telegramId))

        if (existing.length > 0) {
            // Update existing link
            await db
                .update(telegramUsers)
                .set({ userId, telegramUsername: username })
                .where(eq(telegramUsers.telegramId, telegramId))
        } else {
            // Create new link
            await db.insert(telegramUsers).values({
                id: createId(),
                telegramId,
                telegramUsername: username,
                userId,
            })
        }

        await sendMessage(
            chatId,
            '✅ Account linked successfully!\n\n' +
                'You can now add transactions by sending messages like:\n' +
                '• "Spent $50 on groceries"\n' +
                '• "Coffee $5.50"\n\n' +
                'Use /accounts to see your accounts and /setdefaults to configure defaults.'
        )
    } catch (error) {
        console.error('Error linking account:', error)
        await sendMessage(
            chatId,
            '❌ Invalid link code. Please generate a new one from the app.'
        )
    }
}

async function handleStatusCommand(chatId: number, telegramId: string) {
    const [user] = await db
        .select()
        .from(telegramUsers)
        .where(eq(telegramUsers.telegramId, telegramId))

    if (!user) {
        await sendMessage(
            chatId,
            '❌ Your Telegram is not linked to any Cost Keeper account.\n\nUse /link to connect your account.'
        )
        return
    }

    let status = '✅ Account linked!\n\n'

    if (user.defaultAccountId) {
        const [account] = await db
            .select({ name: accounts.name })
            .from(accounts)
            .where(eq(accounts.id, user.defaultAccountId))
        status += `📁 Default Account: ${account?.name || 'Not found'}\n`
    } else {
        status += '📁 Default Account: Not set\n'
    }

    if (user.defaultCategoryId) {
        const [category] = await db
            .select({ name: categories.name })
            .from(categories)
            .where(eq(categories.id, user.defaultCategoryId))
        status += `🏷️ Default Category: ${category?.name || 'Not found'}\n`
    } else {
        status += '🏷️ Default Category: Not set\n'
    }

    status += '\nUse /setdefaults to change your defaults.'
    await sendMessage(chatId, status)
}

async function handleAccountsCommand(chatId: number, telegramId: string) {
    const [user] = await db
        .select()
        .from(telegramUsers)
        .where(eq(telegramUsers.telegramId, telegramId))

    if (!user) {
        await sendMessage(
            chatId,
            '❌ Please link your account first using /link'
        )
        return
    }

    const userAccounts = await db
        .select({ id: accounts.id, name: accounts.name })
        .from(accounts)
        .where(eq(accounts.userId, user.userId))

    if (userAccounts.length === 0) {
        await sendMessage(
            chatId,
            '📁 No accounts found.\n\nCreate accounts in your Cost Keeper app first.'
        )
        return
    }

    const list = userAccounts.map((a, i) => `${i + 1}. ${a.name}`).join('\n')
    await sendMessage(chatId, `📁 *Your Accounts:*\n\n${list}`, {
        parseMode: 'Markdown',
    })
}

async function handleCategoriesCommand(chatId: number, telegramId: string) {
    const [user] = await db
        .select()
        .from(telegramUsers)
        .where(eq(telegramUsers.telegramId, telegramId))

    if (!user) {
        await sendMessage(
            chatId,
            '❌ Please link your account first using /link'
        )
        return
    }

    const userCategories = await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(eq(categories.userId, user.userId))

    if (userCategories.length === 0) {
        await sendMessage(
            chatId,
            '🏷️ No categories found.\n\nCreate categories in your Cost Keeper app first.'
        )
        return
    }

    const list = userCategories.map((c, i) => `${i + 1}. ${c.name}`).join('\n')
    await sendMessage(chatId, `🏷️ *Your Categories:*\n\n${list}`, {
        parseMode: 'Markdown',
    })
}

async function handleSetDefaultsCommand(chatId: number, telegramId: string) {
    const [user] = await db
        .select()
        .from(telegramUsers)
        .where(eq(telegramUsers.telegramId, telegramId))

    if (!user) {
        await sendMessage(
            chatId,
            '❌ Please link your account first using /link'
        )
        return
    }

    const userAccounts = await db
        .select({ id: accounts.id, name: accounts.name })
        .from(accounts)
        .where(eq(accounts.userId, user.userId))

    if (userAccounts.length === 0) {
        await sendMessage(
            chatId,
            '❌ You need to create at least one account in Cost Keeper first.'
        )
        return
    }

    // Create inline keyboard for account selection
    const accountButtons = userAccounts.map((a) => [
        { text: a.name, callback_data: `setaccount_${a.id}` },
    ])

    await sendInlineKeyboard(
        chatId,
        '📁 Select your default account:',
        accountButtons
    )
}

async function handleTransactionMessage(
    chatId: number,
    telegramId: string,
    text: string
) {
    // Check if user is linked
    const [user] = await db
        .select()
        .from(telegramUsers)
        .where(eq(telegramUsers.telegramId, telegramId))

    if (!user) {
        await sendMessage(
            chatId,
            '❌ Please link your account first using /link command.'
        )
        return
    }

    // Check if user has a default account
    if (!user.defaultAccountId) {
        await sendMessage(
            chatId,
            '❌ Please set a default account first using /setdefaults'
        )
        return
    }

    // Get user's categories for context
    const userCategories = await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(eq(categories.userId, user.userId))

    const categoryNames = userCategories.map((c) => c.name)

    // Parse the message with Gemini
    await sendMessage(chatId, '🔄 Processing...')

    const parsed = await parseTransactionMessage(text, categoryNames)

    if (!parsed) {
        await sendMessage(
            chatId,
            "❌ I couldn't understand that as a transaction.\n\n" +
                'Try something like:\n' +
                '• "Spent $50 on groceries"\n' +
                '• "Coffee at Starbucks $5.50"\n' +
                '• "Received $1000 salary"'
        )
        return
    }

    // Find matching category or use default
    let categoryId = user.defaultCategoryId
    if (parsed.categoryHint) {
        const matchingCategory = userCategories.find(
            (c) =>
                c.name
                    .toLowerCase()
                    .includes(parsed.categoryHint!.toLowerCase()) ||
                parsed
                    .categoryHint!.toLowerCase()
                    .includes(c.name.toLowerCase())
        )
        if (matchingCategory) {
            categoryId = matchingCategory.id
        }
    }

    // If still no category, require one
    if (!categoryId) {
        await sendMessage(
            chatId,
            '❌ Please set a default category using /setdefaults or create categories in the app.'
        )
        return
    }

    // Create the transaction
    try {
        const [newTransaction] = await db
            .insert(transactions)
            .values({
                id: createId(),
                amount: parsed.amount,
                payee: parsed.payee,
                notes: parsed.notes
                    ? `${parsed.notes} (via Telegram)`
                    : 'Added via Telegram',
                date: parsed.date,
                accountId: user.defaultAccountId,
                categoryId: categoryId,
            })
            .returning()

        const categoryName =
            userCategories.find((c) => c.id === categoryId)?.name || 'Unknown'

        await sendMessage(
            chatId,
            `✅ Transaction added!\n\n` +
                `💰 Amount: ${formatAmount(parsed.amount)}\n` +
                `🏷️ Category: ${categoryName}\n` +
                (parsed.payee ? `🏪 Payee: ${parsed.payee}\n` : '') +
                `📅 Date: ${parsed.date.toLocaleDateString()}`
        )
    } catch (error) {
        console.error('Error creating transaction:', error)
        await sendMessage(
            chatId,
            '❌ Failed to create transaction. Please try again.'
        )
    }
}

export default app
