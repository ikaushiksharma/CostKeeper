'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Check, Copy, Link2, Loader2, RefreshCw, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function TelegramSettings() {
    const { userId } = useAuth()
    const [linkCode, setLinkCode] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)

    const generateLinkCode = async () => {
        if (!userId) {
            toast.error('You must be logged in to generate a link code')
            return
        }

        setIsGenerating(true)
        try {
            const response = await fetch('/api/telegram/generate-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    telegramCode: crypto.randomUUID(),
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to generate link code')
            }

            const data = await response.json()
            setLinkCode(data.linkCode)
            toast.success('Link code ready. It works for 10 minutes.')
        } catch (error) {
            console.error('Error generating link code:', error)
            toast.error('Failed to generate link code')
        } finally {
            setIsGenerating(false)
        }
    }

    const copyToClipboard = async () => {
        if (!linkCode) return

        const command = `/link ${linkCode}`
        try {
            await navigator.clipboard.writeText(command)
        } catch {
            toast.error(
                "Couldn't copy. Select the command and copy it by hand."
            )
            return
        }
        setCopied(true)
        toast.success('Command copied.')
        setTimeout(() => setCopied(false), 2000)
    }

    const steps = [
        'Open the CostKeeper bot in Telegram. Ask your admin for its username.',
        'Generate a link code below and copy the command.',
        'Send the command to the bot. The code works for 10 minutes.',
        'Message the bot whenever you spend or receive money.',
    ]

    const examples = [
        { message: 'Spent 450 on groceries', result: '₹450 expense' },
        { message: 'Chai at Tapri 60', result: '₹60 expense, payee Tapri' },
        { message: 'Received 72000 salary', result: '₹72,000 income' },
    ]

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Send className="size-4 text-muted-foreground" />
                    <CardTitle>Telegram</CardTitle>
                </div>
                <CardDescription>
                    Add transactions by messaging a bot, without opening the
                    app.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <ol className="space-y-3">
                    {steps.map((step, i) => (
                        <li key={step} className="flex gap-3 text-sm">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums">
                                {i + 1}
                            </span>
                            <span className="pt-0.5 text-muted-foreground">
                                {step}
                            </span>
                        </li>
                    ))}
                </ol>

                <div className="space-y-3 rounded-md border bg-muted/40 p-4">
                    {linkCode ? (
                        <>
                            <div className="flex items-center gap-2">
                                <Input
                                    readOnly
                                    aria-label="Link command"
                                    value={`/link ${linkCode}`}
                                    className="font-mono text-sm"
                                    onFocus={(e) => e.currentTarget.select()}
                                />
                                <Button
                                    variant="outline"
                                    onClick={copyToClipboard}
                                    className="shrink-0"
                                >
                                    {copied ? (
                                        <Check className="size-4 text-income" />
                                    ) : (
                                        <Copy className="size-4" />
                                    )}
                                    {copied ? 'Copied' : 'Copy'}
                                </Button>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground">
                                    Expires in 10 minutes.
                                </p>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={generateLinkCode}
                                    disabled={isGenerating}
                                >
                                    <RefreshCw
                                        className={cn(
                                            'size-3.5',
                                            isGenerating && 'animate-spin'
                                        )}
                                    />
                                    New code
                                </Button>
                            </div>
                        </>
                    ) : (
                        <Button
                            onClick={generateLinkCode}
                            disabled={isGenerating}
                            className="w-full sm:w-auto"
                        >
                            {isGenerating ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Link2 className="size-4" />
                            )}
                            Generate link code
                        </Button>
                    )}
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Things you can send</h3>
                    <ul className="divide-y rounded-md border text-sm">
                        {examples.map((example) => (
                            <li
                                key={example.message}
                                className="flex flex-col gap-0.5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <span className="font-mono text-[13px]">
                                    {example.message}
                                </span>
                                <span className="text-muted-foreground">
                                    {example.result}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}
