'use client'

import { useState, KeyboardEvent } from 'react'
import { Send, Loader2, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { useQuickEntry } from '@/features/transactions/api/use-quick-entry'
import { useGetSettings } from '@/features/settings/api/use-get-settings'

export function QuickTransactionEntry() {
    const [message, setMessage] = useState('')
    const quickEntryMutation = useQuickEntry()
    const settingsQuery = useGetSettings()

    const handleSubmit = () => {
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

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const isLoading = quickEntryMutation.isPending

    return (
        <Card className="border-none drop-shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <Zap className="size-5 text-amber-500" />
                    <CardTitle className="text-lg">Quick Add</CardTitle>
                </div>
                <CardDescription className="text-xs">
                    Type naturally: &quot;Spent 150 on groceries&quot; or
                    &quot;Coffee 50 from Cash&quot;
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g., Lunch 200 category Food"
                            disabled={isLoading}
                            className="pr-10"
                        />
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Sparkles className="size-4 text-muted-foreground" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                    <p className="text-xs">
                                        AI-powered parsing understands natural
                                        language like:
                                    </p>
                                    <ul className="text-xs mt-1 space-y-0.5 text-muted-foreground">
                                        <li>
                                            &bull; &quot;Spent 500 on groceries
                                            yesterday&quot;
                                        </li>
                                        <li>
                                            &bull; &quot;Coffee 75 from Cash
                                            account&quot;
                                        </li>
                                        <li>
                                            &bull; &quot;Salary 50000
                                            received&quot;
                                        </li>
                                        <li>
                                            &bull; &quot;Dinner 800 category
                                            Restaurant&quot;
                                        </li>
                                    </ul>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !message.trim()}
                        size="icon"
                    >
                        {isLoading ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Send className="size-4" />
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
