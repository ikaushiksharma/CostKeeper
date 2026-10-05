import { db } from '@/db/drizzle'
import { settings } from '@/db/schema'
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { DEFAULT_SETTINGS, upsertSettings } from '@/lib/settings'

const app = new Hono()
    .get('/', clerkMiddleware(), async (ctx) => {
        const auth = getAuth(ctx)

        if (!auth?.userId) {
            return ctx.json({ error: 'Unauthorized.' }, 401)
        }

        const data = await db
            .select({
                dateTimeMode: settings.dateTimeMode,
                defaultAccountId: settings.defaultAccountId,
                defaultCategoryId: settings.defaultCategoryId,
            })
            .from(settings)
            .where(eq(settings.userId, auth.userId))

        // Users who never saved a setting have no row yet.
        return ctx.json({ data: data[0] ?? DEFAULT_SETTINGS })
    })
    .patch(
        '/',
        clerkMiddleware(),
        zValidator(
            'json',
            z.object({
                dateTimeMode: z.boolean().optional(),
                defaultAccountId: z.string().nullable().optional(),
                defaultCategoryId: z.string().nullable().optional(),
            })
        ),

        async (ctx) => {
            const auth = getAuth(ctx)
            const values = ctx.req.valid('json')

            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }

            await upsertSettings(auth.userId, values)

            return ctx.json({ success: true })
        }
    )

export default app
