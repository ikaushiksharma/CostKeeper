import { GoogleGenerativeAI } from '@google/generative-ai'
import { convertAmountToMilliunits } from './utils'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface ParsedTransaction {
    amount: number // in cents (negative for expenses, positive for income)
    payee: string | null
    notes: string | null
    date: Date
    categoryHint: string | null // category name hint for matching
    accountHint: string | null // account name hint for matching
}

export async function parseTransactionMessage(
    message: string,
    existingCategories: string[],
    existingAccounts: string[] = []
): Promise<ParsedTransaction | null> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Get today's date in Indian timezone (IST, UTC+5:30)
    const todayISO = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata',
    }) // YYYY-MM-DD format

    const prompt = `You are a transaction parser for an expense tracker app. Parse the following message and extract transaction details.

User message: "${message}"

Today's date is: ${todayISO} (Indian Standard Time)

Available categories: ${existingCategories.length > 0 ? existingCategories.join(', ') : 'None specified'}
Available accounts: ${existingAccounts.length > 0 ? existingAccounts.join(', ') : 'None specified'}

Rules:
1. Amount MUST be in decimal
   - Example: 40 rupees = 40.00, 5.50 rupees = 5.50
   - Expenses should be NEGATIVE (e.g., -40.00 for spending 40)
   - Income should be POSITIVE (e.g., +100.00 for receiving 100)
2. If no date is mentioned, use today's date: ${todayISO}
3. Support various date formats like "2026-03-15", "March 15", "yesterday", "last week", etc. Always resolve to an actual date.
4. Try to match a category from the available categories, or suggest a new one.
5. Try to match an account from the available accounts if mentioned (look for patterns like "from X account", "in X", "account X").
6. Extract the payee/merchant/payment for if mentioned.
7. Any additional context goes in notes.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
    "amount": <number in decimal, negative for expenses, e.g., -40.00 for 40 rupees spent>,
    "payee": "<string or null>",
    "notes": "<string or null>",
    "date": "<ISO date string, e.g., ${todayISO}>",
    "categoryHint": "<string or null>",
    "accountHint": "<string or null>"
}

If you cannot parse a valid transaction from the message, respond with: null`

    try {
        const result = await model.generateContent(prompt)
        const response = result.response.text().trim()

        // Try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            if (response === 'null' || response.includes('null')) {
                return null
            }
            return null
        }

        const parsed = JSON.parse(jsonMatch[0])

        if (!parsed || typeof parsed.amount !== 'number') {
            return null
        }

        return {
            amount: convertAmountToMilliunits(parsed.amount),
            payee: parsed.payee || parsed.categoryHint,
            notes: parsed.notes || null,
            // Parse date and set to noon IST to avoid timezone boundary issues
            date: new Date(`${parsed.date}T12:00:00+05:30`),
            categoryHint: parsed.categoryHint || null,
            accountHint: parsed.accountHint || null,
        }
    } catch (error) {
        console.error('Error parsing transaction with Gemini:', error)
        return null
    }
}
