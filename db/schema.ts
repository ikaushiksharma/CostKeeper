import { relations } from 'drizzle-orm'
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'
export const accounts = pgTable('accounts', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    userId: text('user_id').notNull(),
})

export const categories = pgTable('categories', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    userId: text('user_id').notNull(),
})

export const insertAccountSchema = createInsertSchema(accounts)
export const insertCategorySchema = createInsertSchema(categories)
