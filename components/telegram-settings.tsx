'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Copy, Check, MessageCircle, RefreshCw } from 'lucide-react'
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
            toast.success('Link code generated! Valid for 10 minutes.')
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
        await navigator.clipboard.writeText(command)
        setCopied(true)
        toast.success('Copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Card className="border-none drop-shadow-sm mt-6">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <MessageCircle className="size-5 text-blue-500" />
                    <CardTitle className="text-xl">
                        Telegram Integration
                    </CardTitle>
                </div>
                <CardDescription>
                    Add transactions directly from Telegram by linking your
                    account
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <h4 className="text-sm font-medium">How to connect:</h4>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>
                            Search for your bot on Telegram (ask your admin for
                            the bot username)
                        </li>
                        <li>Click &quot;Generate Link Code&quot; below</li>
                        <li>
                            Send the{' '}
                            <code className="bg-muted px-1 rounded">/link</code>{' '}
                            command with the code to the bot
                        </li>
                        <li>Start adding transactions by sending messages!</li>
                    </ol>
                </div>

                <div className="space-y-3">
                    <Button
                        onClick={generateLinkCode}
                        disabled={isGenerating}
                        variant="outline"
                        className="w-full sm:w-auto"
                    >
                        {isGenerating ? (
                            <RefreshCw className="size-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="size-4 mr-2" />
                        )}
                        Generate Link Code
                    </Button>

                    {linkCode && (
                        <div className="flex items-center gap-2">
                            <Input
                                readOnly
                                value={`/link ${linkCode}`}
                                className="font-mono text-sm"
                            />
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={copyToClipboard}
                            >
                                {copied ? (
                                    <Check className="size-4 text-green-500" />
                                ) : (
                                    <Copy className="size-4" />
                                )}
                            </Button>
                        </div>
                    )}

                    {linkCode && (
                        <p className="text-xs text-muted-foreground">
                            This code expires in 10 minutes. Copy the command
                            and send it to the Telegram bot.
                        </p>
                    )}
                </div>

                <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">
                        Example messages:
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                            &quot;Spent 50 on groceries&quot; → Adds Rs 50
                            expense
                        </p>
                        <p>
                            &quot;Coffee at Starbucks 5.50&quot; → Adds Rs 5.50
                            expense for payee
                        </p>
                        <p>
                            &quot;Received 1000 salary&quot; → Adds Rs 1000
                            income
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
