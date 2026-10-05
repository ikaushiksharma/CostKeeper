import { relations } from 'drizzle-orm'
import {
    boolean,
    date,
    index,
    integer,
    pgEnum,
    pgTable,
    text,
    timestamp,
} from 'drizzle-orm/pg-core'
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

// Goals: periodic targets (save up, pay off, allowance) tracked over periods.
export const goalKind = pgEnum('goal_kind', ['save', 'payoff', 'allowance'])
export const goalCadence = pgEnum('goal_cadence', [
    'month',
    'quarter',
    'half_year',
    'year',
    'custom',
])
export const goalStatus = pgEnum('goal_status', [
    'active',
    'paused',
    'archived',
])
export const goalCarry = pgEnum('goal_carry', [
    'none',
    'surplus',
    'shortfall',
    'both',
])
export const goalRole = pgEnum('goal_role', ['contribution', 'target'])

export const goals = pgTable(
    'goals',
    {
        id: text('id').primaryKey(),
        userId: text('user_id').notNull(),
        name: text('name').notNull(),
        kind: goalKind('kind').notNull(),
        cadence: goalCadence('cadence').notNull().default('half_year'),
        carryOver: goalCarry('carry_over').notNull().default('both'),
        status: goalStatus('status').notNull().default('active'),
        // Contributions are filed under this category and, unless picked,
        // this account.
        categoryId: text('category_id').references(() => categories.id, {
            onDelete: 'set null',
        }),
        accountId: text('account_id').references(() => accounts.id, {
            onDelete: 'set null',
        }),
        notes: text('notes'),
        createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
        archivedAt: timestamp('archived_at', { mode: 'date' }),
    },
    (t) => ({
        userStatusIdx: index('goals_user_status_idx').on(t.userId, t.status),
    })
)

export const goalPeriods = pgTable(
    'goal_periods',
    {
        id: text('id').primaryKey(),
        goalId: text('goal_id')
            .notNull()
            .references(() => goals.id, { onDelete: 'cascade' }),
        label: text('label'),
        // Inclusive: the period covers the whole of ends_on.
        // Calendar days ('yyyy-MM-dd'), compared against transaction dates
        // in the app time zone (APP_TIME_ZONE in lib/goals.ts).
        startsOn: date('starts_on', { mode: 'string' }).notNull(),
        endsOn: date('ends_on', { mode: 'string' }).notNull(),
        // Positive milliunits.
        targetAmount: integer('target_amount').notNull(),
        // Signed milliunits carried from the previous period:
        // positive = shortfall added, negative = surplus credited.
        carryIn: integer('carry_in').notNull().default(0),
        closedAt: timestamp('closed_at', { mode: 'date' }),
        createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
    },
    (t) => ({
        goalStartIdx: index('goal_periods_goal_start_idx').on(
            t.goalId,
            t.startsOn
        ),
    })
)

export const goalsRelations = relations(goals, ({ many, one }) => ({
    periods: many(goalPeriods),
    transactions: many(transactions),
    category: one(categories, {
        fields: [goals.categoryId],
        references: [categories.id],
    }),
    account: one(accounts, {
        fields: [goals.accountId],
        references: [accounts.id],
    }),
}))

export const goalPeriodsRelations = relations(goalPeriods, ({ one }) => ({
    goal: one(goals, {
        fields: [goalPeriods.goalId],
        references: [goals.id],
    }),
}))

export const transactions = pgTable(
    'transactions',
    {
        id: text('id').primaryKey(),
        amount: integer('amount').notNull(),
        payee: text('payee'),
        notes: text('notes'),
        date: timestamp('date', { mode: 'date' }).notNull(),
        accountId: text('account_id')
            .notNull()
            .references(() => accounts.id, {
                onDelete: 'cascade',
            }),
        categoryId: text('category_id')
            .notNull()
            .references(() => categories.id, {
                onDelete: 'set null',
            }),
        // Set when the transaction counts toward a goal. Goal-linked rows are kept
        // out of income/expense totals and summed into goal progress instead.
        goalId: text('goal_id').references(() => goals.id, {
            onDelete: 'set null',
        }),
        goalRole: goalRole('goal_role'),
    },
    (t) => ({
        goalIdx: index('transactions_goal_idx').on(t.goalId),
    })
)

export const transactionsRelations = relations(transactions, ({ one }) => ({
    account: one(accounts, {
        fields: [transactions.accountId],
        references: [accounts.id],
    }),
    categories: one(categories, {
        fields: [transactions.categoryId],
        references: [categories.id],
    }),
    goal: one(goals, {
        fields: [transactions.goalId],
        references: [goals.id],
    }),
}))

export const insertTransactionSchema = createInsertSchema(transactions, {
    date: z.coerce.date(),
})

export const settings = pgTable('settings', {
    dateTimeMode: boolean('date_time_mode').default(false),
    userId: text('user_id').primaryKey(),
    defaultAccountId: text('default_account_id')
        .references(() => accounts.id, {
            onDelete: 'set null',
        })
        .default(''),
    defaultCategoryId: text('default_category_id')
        .references(() => categories.id, {
            onDelete: 'set null',
        })
        .default(''),
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
