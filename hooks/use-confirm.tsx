import { useState, type JSX } from 'react'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

type ConfirmOptions = {
    confirmLabel?: string
    destructive?: boolean
}

export const useConfirm = (
    title: string,
    message: string,
    { confirmLabel = 'Confirm', destructive = false }: ConfirmOptions = {}
): [() => JSX.Element, () => Promise<unknown>] => {
    const [promise, setPromise] = useState<{
        resolve: (value: boolean) => void
    } | null>(null)

    const confirm = () =>
        new Promise((resolve) => {
            setPromise({ resolve })
        })

    const handleClose = () => setPromise(null)

    const handleConfirm = () => {
        promise?.resolve(true)
        handleClose()
    }

    const handleCancel = () => {
        promise?.resolve(false)
        handleClose()
    }

    const ConfirmationDialog = () => (
        <Dialog open={promise !== null} onOpenChange={handleCancel}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{message}</DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2 pt-2 sm:gap-0">
                    <Button onClick={handleCancel} variant="outline">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        variant={destructive ? 'destructive' : 'default'}
                        autoFocus={!destructive}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )

    return [ConfirmationDialog, confirm]
}
