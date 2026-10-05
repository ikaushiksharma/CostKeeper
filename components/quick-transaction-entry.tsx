'use client'

import { ArrowUp, Loader2, Sparkles } from 'lucide-react'
import { type FormEvent, useId, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useGetSettings } from '@/features/settings/api/use-get-settings'
import { useQuickEntry } from '@/features/transactions/api/use-quick-entry'

const EXAMPLES = [
    'Lunch 240 at Saravana Bhavan',
    'Auto 85 from Cash',
    'Salary 72,000 received',
    'Electricity bill 1,860 yesterday',
]

export function QuickTransactionEntry() {
    const [message, setMessage] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const inputId = useId()
    const hintId = useId()
    const quickEntryMutation = useQuickEntry()
    const settingsQuery = useGetSettings()

    const handleSubmit = (e?: FormEvent) => {
        e?.preventDefault()
        if (!message.trim()) return

        quickEntryMutation.mutate(
            {
                message: message.trim(),
                defaultAccountId:
                    settingsQuery.data?.defaultAccountId ?? undefined,
                defaultCategoryId:
                    settingsQuery.data?.defaultCategoryId ?? undefined,
            },
            {
                onSuccess: () => {
                    setMessage('')
                },
            }
        )
    }

    const fillExample = (example: string) => {
        setMessage(example)
        inputRef.current?.focus()
    }

    const isLoading = quickEntryMutation.isPending

    return (
        <section aria-labelledby={`${inputId}-label`} className="space-y-2.5">
            <form
                onSubmit={handleSubmit}
                className="group flex items-center gap-2 rounded-lg border bg-card p-1.5 pl-4 shadow-[0_1px_2px_hsl(240_10%_10%/0.04)] transition-shadow focus-within:border-ring focus-within:ring-1 focus-within:ring-ring"
            >
                <Sparkles className="size-4 shrink-0 text-brand" aria-hidden />
                <label
                    id={`${inputId}-label`}
                    htmlFor={inputId}
                    className="sr-only"
                >
                    Quick add a transaction in plain words
                </label>
                <input
                    ref={inputRef}
                    id={inputId}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe a transaction, e.g. Chai 40 from Cash"
                    disabled={isLoading}
                    aria-describedby={hintId}
                    autoComplete="off"
                    enterKeyHint="send"
                    className="h-10 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground disabled:opacity-60"
                />
                <Button
                    type="submit"
                    variant="brand"
                    size="sm"
                    disabled={isLoading || !message.trim()}
                    className="h-10 rounded-md px-4"
                >
                    {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <ArrowUp className="size-4" />
                    )}
                    <span className="hidden sm:inline">
                        {isLoading ? 'Adding' : 'Add'}
                    </span>
                    <span className="sr-only sm:hidden">Add transaction</span>
                </Button>
            </form>

            <div
                id={hintId}
                className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-muted-foreground [scrollbar-width:none]"
            >
                <span className="shrink-0">
                    AI reads amount, payee, account and date. Try
                </span>
                {EXAMPLES.map((example) => (
                    <button
                        key={example}
                        type="button"
                        onClick={() => fillExample(example)}
                        className="shrink-0 rounded-full border bg-card px-2.5 py-1 text-foreground/80 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {example}
                    </button>
                ))}
            </div>
        </section>
    )
}
