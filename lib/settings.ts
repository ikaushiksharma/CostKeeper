import { db } from '@/db/drizzle'
import { settings } from '@/db/schema'

export type SettingsValues = {
    dateTimeMode?: boolean
    defaultAccountId?: string | null
    defaultCategoryId?: string | null
}

// What a user gets before they have ever saved a setting. The table defaults
// the id columns to '' which would violate their foreign keys, so a first
// insert must always pass explicit nulls.
export const DEFAULT_SETTINGS = {
    dateTimeMode: false,
    defaultAccountId: null,
    defaultCategoryId: null,
} satisfies Required<SettingsValues>

// Nothing creates a settings row at sign-up, so a plain UPDATE silently does
// nothing for users without one. Upsert instead: insert with defaults, or
// update only the fields that were passed.
export async function upsertSettings(userId: string, values: SettingsValues) {
    const changes = Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== undefined)
    ) as SettingsValues

    if (Object.keys(changes).length === 0) return

    await db
        .insert(settings)
        .values({ ...DEFAULT_SETTINGS, ...changes, userId })
        .onConflictDoUpdate({ target: settings.userId, set: changes })
}
