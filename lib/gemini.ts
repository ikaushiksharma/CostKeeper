import { GoogleGenerativeAI } from '@google/generative-ai'

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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are a transaction parser for an expense tracker app. Parse the following message and extract transaction details.

User message: "${message}"

Available categories: ${existingCategories.length > 0 ? existingCategories.join(', ') : 'None specified'}
Available accounts: ${existingAccounts.length > 0 ? existingAccounts.join(', ') : 'None specified'}

Rules:
1. Amount should be in cents (multiply by 100). Expenses should be NEGATIVE, income should be POSITIVE.
2. If no date is mentioned, use today's date. Support various date formats like "2024-03-15", "March 15", "yesterday", "last week", etc.
3. Try to match a category from the available categories, or suggest a new one.
4. Try to match an account from the available accounts if mentioned (look for patterns like "from X account", "in X", "account X").
5. Extract the payee/merchant if mentioned.
6. Any additional context goes in notes.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
    "amount": <number in cents, negative for expenses>,
    "payee": "<string or null>",
    "notes": "<string or null>",
    "date": "<ISO date string>",
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
            amount: parsed.amount,
            payee: parsed.payee || null,
            notes: parsed.notes || null,
            date: new Date(parsed.date),
            categoryHint: parsed.categoryHint || null,
            accountHint: parsed.accountHint || null,
        }
    } catch (error) {
        console.error('Error parsing transaction with Gemini:', error)
        return null
    }
}

export async function generateBotResponse(
    context: string,
    userMessage: string
): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `You are a helpful expense tracker bot assistant. Keep responses brief and friendly.

Context: ${context}
User message: "${userMessage}"

Provide a short, helpful response.`

    try {
        const result = await model.generateContent(prompt)
        return result.response.text().trim()
    } catch (error) {
        console.error('Error generating bot response:', error)
        return "I'm having trouble processing that right now. Please try again."
    }
}
