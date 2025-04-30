import { db } from '@/db/drizzle'
import { settings } from '@/db/schema'
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

const app = new Hono()
    .get('/', clerkMiddleware(), async (ctx) => {
        const auth = getAuth(ctx)

        if (!auth?.userId) {
            return ctx.json({ error: 'Unauthorized.' }, 401)
        }

        const data = await db
            .select({
                dateTimeMode: settings.dateTimeMode,
            })
            .from(settings)
            .where(eq(settings.userId, auth.userId))

        return ctx.json({ data: data?.[0] })
    })
    .patch(
        '/',
        clerkMiddleware(),
        zValidator(
            'json',
            z.object({
                dateTimeMode: z.boolean(),
            })
        ),

        async (ctx) => {
            const auth = getAuth(ctx)
            const values = ctx.req.valid('json')

            if (!auth?.userId) {
                return ctx.json({ error: 'Unauthorized.' }, 401)
            }

            await db
                .update(settings)
                .set(values)
                .where(eq(settings.userId, auth.userId))

            return ctx.json({ success: true })
        }
    )

export default app
