import { clerkMiddleware, getAuth } from '@hono/clerk-auth'
import { zValidator } from '@hono/zod-validator'
import { createId } from '@paralleldrive/cuid2'
import { and, asc, desc, eq, gte, lte, ne, sql } from 'drizzle-orm'
import type { BatchItem } from 'drizzle-orm/batch'
import { Hono } from 'hono'
import { z } from 'zod'

import { db } from '@/db/drizzle'
import {
    accounts,
    categories,
    goalPeriods,
    goals,
    transactions,
} from '@/db/schema'
import { APP_TIME_ZONE, DEFAULT_CARRY } from '@/lib/goals'

const kindSchema = z.enum(['save', 'payoff', 'allowance'])
const cadenceSchema = z.enum([
    'month',
    'quarter',
    'half_year',
    'year',
    'custom',
])
const carrySchema = z.enum(['none', 'surplus', 'shortfall', 'both'])
const statusSchema = z.enum(['active', 'paused', 'archived'])
const dayString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use yyyy-MM-dd')

const periodSchema = z
    .object({
        startsOn: dayString,
        endsOn: dayString,
        // Milliunits, always positive.
        targetAmount: z.number().int().positive(),
        // Signed milliunits carried in from the previous period.
        carryIn: z.number().int().optional(),
        label: z.string().trim().max(60).nullable().optional(),
    })
    .refine((p) => p.endsOn >= p.startsOn, {
        message: 'End date must be on or after the start date',
        path: ['endsOn'],
    })

const goalFieldsSchema = z.object({
    name: z.string().trim().min(1).max(80),
    kind: kindSchema,
    cadence: cadenceSchema,
    carryOver: carrySchema.optional(),
    categoryId: z.string().nullable().optional(),
    accountId: z.string().nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
})

const idParam = z.object({ id: z.string() })
const periodParam = z.object({ id: z.string(), periodId: z.string() })

// A transaction's calendar day in the app time zone. Dates are stored as UTC
// instants (midnight IST is 18:30 the day before), so compare on this.
const txDay = sql`(${transactions.date} at time zone 'UTC' at time zone ${sql.raw(`'${APP_TIME_ZONE}'`)})::date`

// neon-http has no interactive transactions; db.batch runs these atomically.
// Typed as a list so optional statements can be spread in conditionally.
function runBatch(queries: BatchItem<'pg'>[]) {
    const [first, ...rest] = queries
    return db.batch([first, ...rest])
}

async function findGoal(userId: string, id: string) {
    const [goal] = await db
        .select()
        .from(goals)
        .where(and(eq(goals.userId, userId), eq(goals.id, id)))
    return goal
}

async function ownsRow(
    table: typeof accounts | typeof categories,
    userId: string,
    id: string | null | undefined
) {
    if (!id) return true
    const [row] = await db
        .select({ id: table.id })
        .from(table)
        .where(and(eq(table.userId, userId), eq(table.id, id)))
    return !!row
}

async function hasOverlap(
    goalId: string,
    range: { startsOn: string; endsOn: string },
    excludePeriodId?: string
) {
    const [row] = await db
        .select({ id: goalPeriods.id })
        .from(goalPeriods)
        .where(
            and(
                eq(goalPeriods.goalId, goalId),
                lte(goalPeriods.startsOn, range.endsOn),
                gte(goalPeriods.endsOn, range.startsOn),
                excludePeriodId
                    ? ne(goalPeriods.id, excludePeriodId)
                    : undefined
            )
        )
        .limit(1)
    return !!row
}

// Goals with every period and the amount contributed inside each period.
export async function loadGoals(
    userId: string,
    filter: { id?: string; status?: z.infer<typeof statusSchema> | 'all' }
) {
    const goalRows = await db
        .select({
            id: goals.id,
            name: goals.name,
            kind: goals.kind,
            cadence: goals.cadence,
            carryOver: goals.carryOver,
            status: goals.status,
            notes: goals.notes,
            categoryId: goals.categoryId,
            category: categories.name,
            accountId: goals.accountId,
            account: accounts.name,
            createdAt: goals.createdAt,
        })
        .from(goals)
        .leftJoin(categories, eq(goals.categoryId, categories.id))
        .leftJoin(accounts, eq(goals.accountId, accounts.id))
        .where(
            and(
                eq(goals.userId, userId),
                filter.id ? eq(goals.id, filter.id) : undefined,
                filter.status && filter.status !== 'all'
                    ? eq(goals.status, filter.status)
                    : undefined
            )
        )
        .orderBy(asc(goals.createdAt))

    if (goalRows.length === 0) return []

    const periodRows = await db
        .select({
            id: goalPeriods.id,
            goalId: goalPeriods.goalId,
            label: goalPeriods.label,
            startsOn: goalPeriods.startsOn,
            endsOn: goalPeriods.endsOn,
            targetAmount: goalPeriods.targetAmount,
            carryIn: goalPeriods.carryIn,
            closedAt: goalPeriods.closedAt,
            done: sql<number>`coalesce(sum(abs(${transactions.amount})), 0)`.mapWith(
                Number
            ),
            count: sql<number>`count(${transactions.id})`.mapWith(Number),
        })
        .from(goalPeriods)
        .innerJoin(goals, eq(goalPeriods.goalId, goals.id))
        .leftJoin(
            transactions,
            and(
                eq(transactions.goalId, goalPeriods.goalId),
                eq(transactions.goalRole, 'contribution'),
                sql`${txDay} between ${goalPeriods.startsOn} and ${goalPeriods.endsOn}`
            )
        )
        .where(
            and(
                eq(goals.userId, userId),
                filter.id ? eq(goals.id, filter.id) : undefined
            )
        )
        .groupBy(goalPeriods.id)
        .orderBy(asc(goalPeriods.startsOn))

    return goalRows.map((goal) => ({
        ...goal,
        periods: periodRows.filter((p) => p.goalId === goal.id),
    }))
}

const app = new Hono()
    .get(
        '/',
        clerkMiddleware(),
        zValidator(
            'query',
            z.object({
                status: z
                    .enum(['active', 'paused', 'archived', 'all'])
                    .optional(),
            })
        ),
        async (ctx) => {
            const auth = getAuth(ctx)
            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }
            const { status = 'active' } = ctx.req.valid('query')
            const data = await loadGoals(auth.userId, { status })
            return ctx.json({ data })
        }
    )
    // Monthly totals per goal (IST calendar months). Registered before /:id so
    // "stats" is not read as a goal id. Coarser buckets are rolled up client-side.
    .get(
        '/stats',
        clerkMiddleware(),
        zValidator('query', z.object({ goalId: z.string().optional() })),
        async (ctx) => {
            const auth = getAuth(ctx)
            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }
            const { goalId } = ctx.req.valid('query')
            const month = sql<string>`to_char(${txDay}, 'YYYY-MM')`

            const data = await db
                .select({
                    goalId: goals.id,
                    month,
                    total: sql<number>`sum(abs(${transactions.amount}))`.mapWith(
                        Number
                    ),
                    count: sql<number>`count(*)`.mapWith(Number),
                })
                .from(transactions)
                .innerJoin(goals, eq(transactions.goalId, goals.id))
                .where(
                    and(
                        eq(goals.userId, auth.userId),
                        eq(transactions.goalRole, 'contribution'),
                        goalId ? eq(goals.id, goalId) : undefined
                    )
                )
                .groupBy(goals.id, month)
                .orderBy(month)

            return ctx.json({ data })
        }
    )
    .get(
        '/:id',
        clerkMiddleware(),
        zValidator('param', idParam),
        async (ctx) => {
            const auth = getAuth(ctx)
            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }
            const { id } = ctx.req.valid('param')
            const [data] = await loadGoals(auth.userId, { id, status: 'all' })
            if (!data) {
                return ctx.json({ error: 'Not found.' }, 404)
            }
            return ctx.json({ data })
        }
    )
    .post(
        '/',
        clerkMiddleware(),
        zValidator('json', goalFieldsSchema.extend({ period: periodSchema })),
        async (ctx) => {
            const auth = getAuth(ctx)
            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }
            const { period, ...values } = ctx.req.valid('json')

            if (
                !(await ownsRow(accounts, auth.userId, values.accountId)) ||
                !(await ownsRow(categories, auth.userId, values.categoryId))
            ) {
                return ctx.json(
                    { error: 'Account or category not found.' },
                    400
                )
            }

            const goalId = createId()
            // Contributions need a category; give the goal its own unless one
            // was picked, so it also shows up in Quick Add matching.
            const categoryId = values.categoryId || createId()

            await runBatch([
                ...(values.categoryId
                    ? []
                    : [
                          db.insert(categories).values({
                              id: categoryId,
                              name: values.name,
                              userId: auth.userId,
                          }),
                      ]),
                db.insert(goals).values({
                    id: goalId,
                    userId: auth.userId,
                    name: values.name,
                    kind: values.kind,
                    cadence: values.cadence,
                    carryOver: values.carryOver ?? DEFAULT_CARRY[values.kind],
                    categoryId,
                    accountId: values.accountId || null,
                    notes: values.notes || null,
                }),
                db.insert(goalPeriods).values({
                    id: createId(),
                    goalId,
                    startsOn: period.startsOn,
                    endsOn: period.endsOn,
                    targetAmount: period.targetAmount,
                    carryIn: period.carryIn ?? 0,
                    label: period.label || null,
                }),
            ])

            return ctx.json({ data: { id: goalId } })
        }
    )
    .patch(
        '/:id',
        clerkMiddleware(),
        zValidator('param', idParam),
        zValidator(
            'json',
            goalFieldsSchema.extend({ status: statusSchema }).partial()
        ),
        async (ctx) => {
            const auth = getAuth(ctx)
            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }
            const { id } = ctx.req.valid('param')
            const values = ctx.req.valid('json')

            if (
                !(await ownsRow(accounts, auth.userId, values.accountId)) ||
                !(await ownsRow(categories, auth.userId, values.categoryId))
            ) {
                return ctx.json(
                    { error: 'Account or category not found.' },
                    400
                )
            }

            const [data] = await db
                .update(goals)
                .set({
                    ...values,
                    ...(values.status
                        ? {
                              archivedAt:
                                  values.status === 'archived'
                                      ? new Date()
                                      : null,
                          }
                        : {}),
                })
                .where(and(eq(goals.userId, auth.userId), eq(goals.id, id)))
                .returning({ id: goals.id })

            if (!data) {
                return ctx.json({ error: 'Not found.' }, 404)
            }
            return ctx.json({ data })
        }
    )
    .delete(
        '/:id',
        clerkMiddleware(),
        zValidator('param', idParam),
        async (ctx) => {
            const auth = getAuth(ctx)
            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }
            const { id } = ctx.req.valid('param')
            const goal = await findGoal(auth.userId, id)
            if (!goal) {
                return ctx.json({ error: 'Not found.' }, 404)
            }

            // Contributions stay in the ledger as ordinary transactions.
            await runBatch([
                db
                    .update(transactions)
                    .set({ goalId: null, goalRole: null })
                    .where(eq(transactions.goalId, id)),
                db.delete(goals).where(eq(goals.id, id)),
            ])
            return ctx.json({ data: { id } })
        }
    )
    .post(
        '/:id/periods',
        clerkMiddleware(),
        zValidator('param', idParam),
        zValidator('json', periodSchema),
        async (ctx) => {
            const auth = getAuth(ctx)
            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }
            const { id } = ctx.req.valid('param')
            const values = ctx.req.valid('json')

            if (!(await findGoal(auth.userId, id))) {
                return ctx.json({ error: 'Not found.' }, 404)
            }
            if (await hasOverlap(id, values)) {
                return ctx.json(
                    {
                        error: 'This period overlaps another period of this goal.',
                    },
                    400
                )
            }

            const [data] = await db
                .insert(goalPeriods)
                .values({
                    id: createId(),
                    goalId: id,
                    startsOn: values.startsOn,
                    endsOn: values.endsOn,
                    targetAmount: values.targetAmount,
                    carryIn: values.carryIn ?? 0,
                    label: values.label || null,
                })
                .returning({ id: goalPeriods.id })
            return ctx.json({ data })
        }
    )
    .patch(
        '/:id/periods/:periodId',
        clerkMiddleware(),
        zValidator('param', periodParam),
        zValidator('json', periodSchema),
        async (ctx) => {
            const auth = getAuth(ctx)
            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }
            const { id, periodId } = ctx.req.valid('param')
            const values = ctx.req.valid('json')

            if (!(await findGoal(auth.userId, id))) {
                return ctx.json({ error: 'Not found.' }, 404)
            }
            if (await hasOverlap(id, values, periodId)) {
                return ctx.json(
                    {
                        error: 'This period overlaps another period of this goal.',
                    },
                    400
                )
            }

            const [data] = await db
                .update(goalPeriods)
                .set({
                    startsOn: values.startsOn,
                    endsOn: values.endsOn,
                    targetAmount: values.targetAmount,
                    carryIn: values.carryIn ?? 0,
                    label: values.label || null,
                })
                .where(
                    and(
                        eq(goalPeriods.goalId, id),
                        eq(goalPeriods.id, periodId)
                    )
                )
                .returning({ id: goalPeriods.id })

            if (!data) {
                return ctx.json({ error: 'Not found.' }, 404)
            }
            return ctx.json({ data })
        }
    )
    .delete(
        '/:id/periods/:periodId',
        clerkMiddleware(),
        zValidator('param', periodParam),
        async (ctx) => {
            const auth = getAuth(ctx)
            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }
            const { id, periodId } = ctx.req.valid('param')
            if (!(await findGoal(auth.userId, id))) {
                return ctx.json({ error: 'Not found.' }, 404)
            }
            const [data] = await db
                .delete(goalPeriods)
                .where(
                    and(
                        eq(goalPeriods.goalId, id),
                        eq(goalPeriods.id, periodId)
                    )
                )
                .returning({ id: goalPeriods.id })
            if (!data) {
                return ctx.json({ error: 'Not found.' }, 404)
            }
            return ctx.json({ data })
        }
    )
    .get(
        '/:id/contributions',
        clerkMiddleware(),
        zValidator('param', idParam),
        zValidator(
            'query',
            z.object({ from: dayString.optional(), to: dayString.optional() })
        ),
        async (ctx) => {
            const auth = getAuth(ctx)
            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }
            const { id } = ctx.req.valid('param')
            const { from, to } = ctx.req.valid('query')
            if (!(await findGoal(auth.userId, id))) {
                return ctx.json({ error: 'Not found.' }, 404)
            }

            const data = await db
                .select({
                    id: transactions.id,
                    date: transactions.date,
                    payee: transactions.payee,
                    notes: transactions.notes,
                    amount: transactions.amount,
                    account: accounts.name,
                    accountId: transactions.accountId,
                    category: categories.name,
                    categoryId: transactions.categoryId,
                })
                .from(transactions)
                .innerJoin(accounts, eq(transactions.accountId, accounts.id))
                .leftJoin(
                    categories,
                    eq(transactions.categoryId, categories.id)
                )
                .where(
                    and(
                        eq(accounts.userId, auth.userId),
                        eq(transactions.goalId, id),
                        eq(transactions.goalRole, 'contribution'),
                        from ? sql`${txDay} >= ${from}` : undefined,
                        to ? sql`${txDay} <= ${to}` : undefined
                    )
                )
                .orderBy(desc(transactions.date))
                .limit(1000)

            return ctx.json({ data })
        }
    )
    .post(
        '/:id/contributions',
        clerkMiddleware(),
        zValidator('param', idParam),
        zValidator(
            'json',
            z.object({
                // Milliunits, entered as a positive number.
                amount: z.number().int().positive(),
                date: z.coerce.date(),
                payee: z.string().trim().max(120).nullable().optional(),
                notes: z.string().max(500).nullable().optional(),
                accountId: z.string().nullable().optional(),
            })
        ),
        async (ctx) => {
            const auth = getAuth(ctx)
            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }
            const { id } = ctx.req.valid('param')
            const values = ctx.req.valid('json')

            const goal = await findGoal(auth.userId, id)
            if (!goal) {
                return ctx.json({ error: 'Not found.' }, 404)
            }

            const accountId = values.accountId || goal.accountId
            if (!accountId) {
                return ctx.json(
                    { error: 'Pick an account for this contribution.' },
                    400
                )
            }
            if (!(await ownsRow(accounts, auth.userId, accountId))) {
                return ctx.json({ error: 'Account not found.' }, 400)
            }

            const categoryId = goal.categoryId ?? createId()
            const transactionId = createId()

            await runBatch([
                ...(goal.categoryId
                    ? []
                    : [
                          db.insert(categories).values({
                              id: categoryId,
                              name: goal.name,
                              userId: auth.userId,
                          }),
                          db
                              .update(goals)
                              .set({ categoryId })
                              .where(eq(goals.id, goal.id)),
                      ]),
                db.insert(transactions).values({
                    id: transactionId,
                    // Money leaving your pocket toward the goal.
                    amount: -Math.abs(values.amount),
                    date: values.date,
                    payee: values.payee || goal.name,
                    notes: values.notes || null,
                    accountId,
                    categoryId,
                    goalId: goal.id,
                    goalRole: 'contribution',
                }),
            ])

            return ctx.json({ data: { id: transactionId } })
        }
    )

export default app
