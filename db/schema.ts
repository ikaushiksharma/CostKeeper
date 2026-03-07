import { relations } from 'drizzle-orm'
import { integer, pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

export const accounts = pgTable('accounts', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    userId: text('user_id').notNull(),
})

export const accountsRelations = relations(accounts, ({ many }) => ({
    transactions: many(transactions),
}))

export const insertAccountSchema = createInsertSchema(accounts)

export const categories = pgTable('categories', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    userId: text('user_id').notNull(),
})

export const categoriesRelations = relations(categories, ({ many }) => ({
    transactions: many(transactions),
}))

export const insertCategorySchema = createInsertSchema(categories)

export const transactions = pgTable('transactions', {
    id: text('id').primaryKey(),
    amount: integer('amount').notNull(),
    payee: text('payee'),
    notes: text('notes'),
    date: timestamp('date', { mode: 'date' }).notNull(),
    accountId: text('account_id')
        .references(() => accounts.id, {
            onDelete: 'cascade',
        })
        .notNull(),
    categoryId: text('category_id')
        .references(() => categories.id, {
            onDelete: 'set null',
        })
        .notNull(),
})

export const transactionsRelations = relations(transactions, ({ one }) => ({
    account: one(accounts, {
        fields: [transactions.accountId],
        references: [accounts.id],
    }),
    categories: one(categories, {
        fields: [transactions.categoryId],
        references: [categories.id],
    }),
}))

export const insertTransactionSchema = createInsertSchema(transactions, {
    date: z.coerce.date(),
})

export const settings = pgTable('settings', {
    dateTimeMode: boolean('date_time_mode').default(false),
    userId: text('user_id').primaryKey(),
})

// Telegram integration - links Telegram users to Clerk users
export const telegramUsers = pgTable('telegram_users', {
    id: text('id').primaryKey(),
    telegramId: text('telegram_id').notNull().unique(),
    telegramUsername: text('telegram_username'),
    userId: text('user_id').notNull(), // Clerk user ID
    defaultAccountId: text('default_account_id').references(() => accounts.id, {
        onDelete: 'set null',
    }),
    defaultCategoryId: text('default_category_id').references(
        () => categories.id,
        {
            onDelete: 'set null',
        }
    ),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
})

export const insertTelegramUserSchema = createInsertSchema(telegramUsers)
