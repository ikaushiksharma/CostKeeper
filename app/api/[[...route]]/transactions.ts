import { clerkMiddleware, getAuth } from '@hono/clerk-auth'
import { zValidator } from '@hono/zod-validator'
import { createId } from '@paralleldrive/cuid2'
import { parse, startOfMonth } from 'date-fns'
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

import { db } from '@/db/drizzle'
import {
    accounts,
    categories,
    insertTransactionSchema,
    transactions,
} from '@/db/schema'
import { parseTransactionMessage } from '@/lib/gemini'

const DEFAULT_PAGE_SIZE = 20

const app = new Hono()
    .get(
        '/',
        zValidator(
            'query',
            z.object({
                from: z.string().optional(),
                to: z.string().optional(),
                accountId: z.string().optional(),
                limit: z.string().optional(),
                offset: z.string().optional(),
            })
        ),
        clerkMiddleware(),
        async (ctx) => {
            const auth = getAuth(ctx)
            const { from, to, accountId, limit, offset } =
                ctx.req.valid('query')

            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }

            const defaultTo = new Date()
            const defaultFrom = startOfMonth(defaultTo)

            const startDate = from
                ? parse(from, 'yyyy-MM-dd', new Date())
                : defaultFrom
            const endDate = to ? parse(to, 'yyyy-MM-dd', new Date()) : defaultTo

            const pageSize = limit ? parseInt(limit, 10) : DEFAULT_PAGE_SIZE
            const pageOffset = offset ? parseInt(offset, 10) : 0

            const data = await db
                .select({
                    id: transactions.id,
                    date: transactions.date,
                    category: categories.name,
                    categoryId: transactions.categoryId,
                    payee: transactions.payee,
                    amount: transactions.amount,
                    notes: transactions.notes,
                    account: accounts.name,
                    accountId: transactions.accountId,
                })
                .from(transactions)
                .innerJoin(accounts, eq(transactions.accountId, accounts.id))
                .leftJoin(
                    categories,
                    eq(transactions.categoryId, categories.id)
                )
                .where(
                    and(
                        accountId
                            ? eq(transactions.accountId, accountId)
                            : undefined,
                        eq(accounts.userId, auth.userId),
                        gte(transactions.date, startDate),
                        lte(transactions.date, endDate)
                    )
                )
                .orderBy(desc(transactions.date))
                .limit(pageSize + 1) // Fetch one extra to check if there are more
                .offset(pageOffset)

            const hasMore = data.length > pageSize
            const resultData = hasMore ? data.slice(0, pageSize) : data

            return ctx.json({
                data: resultData,
                nextOffset: hasMore ? pageOffset + pageSize : null,
                hasMore,
            })
        }
    )
    .get(
        '/:id',
        zValidator(
            'param',
            z.object({
                id: z.string().optional(),
            })
        ),
        clerkMiddleware(),
        async (ctx) => {
            const auth = getAuth(ctx)
            const { id } = ctx.req.valid('param')

            if (!id) {
                return ctx.json({ error: 'Missing id.' }, 400)
            }

            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }

            const [data] = await db
                .select({
                    id: transactions.id,
                    date: transactions.date,
                    categoryId: transactions.categoryId,
                    payee: transactions.payee,
                    amount: transactions.amount,
                    notes: transactions.notes,
                    accountId: transactions.accountId,
                })
                .from(transactions)
                .innerJoin(accounts, eq(transactions.accountId, accounts.id))
                .where(
                    and(
                        eq(transactions.id, id),
                        eq(accounts.userId, auth.userId)
                    )
                )

            if (!data) {
                return ctx.json({ error: 'Not found.' }, 404)
            }

            return ctx.json({ data })
        }
    )
    .post(
        '/',
        clerkMiddleware(),
        zValidator(
            'json',
            insertTransactionSchema.omit({
                id: true,
            })
        ),
        async (ctx) => {
            const auth = getAuth(ctx)
            const values = ctx.req.valid('json')

            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }

            // Get category name if categoryId is provided
            let categoryName: string | null = null
            if (values.categoryId) {
                const [category] = await db
                    .select({ name: categories.name })
                    .from(categories)
                    .where(eq(categories.id, values.categoryId))
                if (category) {
                    categoryName = category.name
                }
            }

            // If payee is null, use category name instead
            const payee = values.payee || categoryName

            const [data] = await db
                .insert(transactions)
                .values({
                    id: createId(),
                    ...values,
                    payee,
                })
                .returning()

            return ctx.json({ data })
        }
    )
    .post(
        '/bulk-create',
        clerkMiddleware(),
        zValidator('json', z.array(insertTransactionSchema.omit({ id: true }))),
        async (ctx) => {
            const auth = getAuth(ctx)
            const values = ctx.req.valid('json')

            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }

            const data = await db
                .insert(transactions)
                .values(
                    values.map((value) => ({
                        id: createId(),
                        ...value,
                    }))
                )
                .returning()

            return ctx.json({ data })
        }
    )
    .post(
        '/bulk-delete',
        clerkMiddleware(),
        zValidator(
            'json',
            z.object({
                ids: z.array(z.string()),
            })
        ),
        async (ctx) => {
            const auth = getAuth(ctx)
            const values = ctx.req.valid('json')

            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }

            const transactionsToDelete = db.$with('transactions_to_delete').as(
                db
                    .select({ id: transactions.id })
                    .from(transactions)
                    .innerJoin(
                        accounts,
                        eq(transactions.accountId, accounts.id)
                    )
                    .where(
                        and(
                            inArray(transactions.id, values.ids),
                            eq(accounts.userId, auth.userId)
                        )
                    )
            )

            const data = await db
                .with(transactionsToDelete)
                .delete(transactions)
                .where(
                    inArray(
                        transactions.id,
                        sql`(select id from ${transactionsToDelete})`
                    )
                )
                .returning({
                    id: transactions.id,
                })

            return ctx.json({ data })
        }
    )
    .patch(
        '/:id',
        clerkMiddleware(),
        zValidator(
            'param',
            z.object({
                id: z.string().optional(),
            })
        ),
        zValidator(
            'json',
            insertTransactionSchema.omit({
                id: true,
            })
        ),
        async (ctx) => {
            const auth = getAuth(ctx)
            const { id } = ctx.req.valid('param')
            const values = ctx.req.valid('json')

            if (!id) {
                return ctx.json({ error: 'Missing id.' }, 400)
            }

            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }

            const transactionsToUpdate = db.$with('transactions_to_update').as(
                db
                    .select({ id: transactions.id })
                    .from(transactions)
                    .innerJoin(
                        accounts,
                        eq(transactions.accountId, accounts.id)
                    )
                    .where(
                        and(
                            eq(transactions.id, id),
                            eq(accounts.userId, auth.userId)
                        )
                    )
            )

            const [data] = await db
                .with(transactionsToUpdate)
                .update(transactions)
                .set(values)
                .where(
                    inArray(
                        transactions.id,
                        sql`(select id from ${transactionsToUpdate})`
                    )
                )
                .returning()

            if (!data) {
                return ctx.json({ error: 'Not found.' }, 404)
            }

            return ctx.json({ data })
        }
    )
    .delete(
        '/:id',
        clerkMiddleware(),
        zValidator(
            'param',
            z.object({
                id: z.string().optional(),
            })
        ),
        async (ctx) => {
            const auth = getAuth(ctx)
            const { id } = ctx.req.valid('param')

            if (!id) {
                return ctx.json({ error: 'Missing id.' }, 400)
            }

            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }

            const transactionsToDelete = db.$with('transactions_to_delete').as(
                db
                    .select({ id: transactions.id })
                    .from(transactions)
                    .innerJoin(
                        accounts,
                        eq(transactions.accountId, accounts.id)
                    )
                    .where(
                        and(
                            eq(transactions.id, id),
                            eq(accounts.userId, auth.userId)
                        )
                    )
            )

            const [data] = await db
                .with(transactionsToDelete)
                .delete(transactions)
                .where(
                    inArray(
                        transactions.id,
                        sql`(select id from ${transactionsToDelete})`
                    )
                )
                .returning({
                    id: transactions.id,
                })

            if (!data) {
                return ctx.json({ error: 'Not found.' }, 404)
            }

            return ctx.json({ data })
        }
    )
    // Quick entry endpoint for natural language transaction input
    .post(
        '/quick-entry',
        clerkMiddleware(),
        zValidator(
            'json',
            z.object({
                message: z.string().min(1),
                defaultAccountId: z.string().optional(),
                defaultCategoryId: z.string().optional(),
            })
        ),
        async (ctx) => {
            const auth = getAuth(ctx)
            const { message, defaultAccountId, defaultCategoryId } =
                ctx.req.valid('json')

            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }

            // Get user's accounts and categories for context
            const userAccounts = await db
                .select({ id: accounts.id, name: accounts.name })
                .from(accounts)
                .where(eq(accounts.userId, auth.userId))

            const userCategories = await db
                .select({ id: categories.id, name: categories.name })
                .from(categories)
                .where(eq(categories.userId, auth.userId))

            if (userAccounts.length === 0) {
                return ctx.json(
                    { error: 'Please create an account first.' },
                    400
                )
            }

            const accountNames = userAccounts.map((a) => a.name)
            const categoryNames = userCategories.map((c) => c.name)

            // Parse the message with Gemini
            const parsed = await parseTransactionMessage(
                message,
                categoryNames,
                accountNames
            )

            if (!parsed) {
                return ctx.json(
                    {
                        error: "Couldn't understand the transaction. Try something like 'Spent 50 on groceries' or 'Coffee 150 from Cash'",
                    },
                    400
                )
            }

            // Find matching account or use default
            let accountId = defaultAccountId || null
            if (parsed.accountHint) {
                const matchingAccount = userAccounts.find(
                    (a) =>
                        a.name
                            .toLowerCase()
                            .includes(parsed.accountHint!.toLowerCase()) ||
                        parsed
                            .accountHint!.toLowerCase()
                            .includes(a.name.toLowerCase())
                )
                if (matchingAccount) {
                    accountId = matchingAccount.id
                }
            }

            // If no account found, use first account as fallback
            if (!accountId) {
                accountId = userAccounts[0].id
            }

            // Find matching category or use default
            let categoryId = defaultCategoryId || null
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

            // If still no category, use first category or return error
            if (!categoryId && userCategories.length > 0) {
                categoryId = userCategories[0].id
            }

            if (!categoryId) {
                return ctx.json(
                    { error: 'Please create a category first.' },
                    400
                )
            }

            // Create the transaction
            const [data] = await db
                .insert(transactions)
                .values({
                    id: createId(),
                    amount: parsed.amount,
                    payee: parsed.payee || parsed.categoryHint || 'Quick Entry',
                    notes: parsed.notes || 'Added via Quick Entry',
                    date: parsed.date,
                    accountId: accountId,
                    categoryId: categoryId,
                })
                .returning()

            const accountName =
                userAccounts.find((a) => a.id === accountId)?.name || 'Unknown'
            const categoryName =
                userCategories.find((c) => c.id === categoryId)?.name ||
                'Unknown'

            return ctx.json({
                data,
                parsed: {
                    amount: parsed.amount,
                    accountName,
                    categoryName,
                    payee: parsed.payee,
                    date: parsed.date,
                },
            })
        }
    )

export default app
