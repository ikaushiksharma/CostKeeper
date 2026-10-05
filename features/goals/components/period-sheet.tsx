import { format } from 'date-fns'
import { Loader2, Trash2 } from 'lucide-react'
import { type FormEvent, useEffect, useId, useMemo, useState } from 'react'

import { DatePicker } from '@/components/date-picker'
import { MoneyInput } from '@/components/money-input'
import { Segmented } from '@/components/segmented'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { useConfirm } from '@/hooks/use-confirm'
import { carryFrom, nextRange, periodLabel, periodProgress } from '@/lib/goals'
import { convertAmountToMilliunits, formatCurrency } from '@/lib/utils'
import { useGetGoal } from '../api/use-get-goal'
import { useDeletePeriod, useSavePeriod } from '../api/use-save-period'
import { usePeriodSheet } from '../hooks/use-period-sheet'

type CarryDirection = 'add' | 'subtract'

export const PeriodSheet = () => {
    const { isOpen, goalId, periodId, onClose } = usePeriodSheet()
    const goalQuery = useGetGoal(goalId)
    const goal = goalQuery.data
    const saveMutation = useSavePeriod(goalId, periodId)
    const deleteMutation = useDeletePeriod(goalId, periodId)
    const ids = { target: useId(), carry: useId(), label: useId() }

    const [ConfirmDialog, confirm] = useConfirm(
        'Delete this period?',
        'Contributions in it stay linked to the goal and show up again if a period covers their dates.',
        { confirmLabel: 'Delete', destructive: true }
    )

    const [startsOn, setStartsOn] = useState<Date | undefined>()
    const [endsOn, setEndsOn] = useState<Date | undefined>()
    const [target, setTarget] = useState('')
    const [carry, setCarry] = useState('')
    const [carryDirection, setCarryDirection] = useState<CarryDirection>('add')
    const [label, setLabel] = useState('')
    const [error, setError] = useState<string | null>(null)

    const latest = useMemo(
        () => (goal ? goal.periods[goal.periods.length - 1] : undefined),
        [goal]
    )

    // Prefill: the period being edited, or the one after the latest period.
    // biome-ignore lint/correctness/useExhaustiveDependencies: prefill only when the sheet opens or its data arrives.
    useEffect(() => {
        if (!isOpen || !goal) return
        setError(null)
        const editing = goal.periods.find((p) => p.id === periodId)
        let carryIn = 0
        if (editing) {
            setStartsOn(editing.startsOn)
            setEndsOn(editing.endsOn)
            setTarget(String(editing.targetAmount))
            setLabel(editing.label ?? '')
            carryIn = editing.carryIn
        } else if (latest) {
            const range = nextRange(goal.cadence, latest)
            setStartsOn(range.startsOn)
            setEndsOn(range.endsOn)
            setTarget(String(latest.targetAmount))
            setLabel('')
            carryIn = carryFrom(
                goal.kind,
                goal.carryOver,
                periodProgress(goal.kind, latest)
            )
        }
        // Round to whole rupees for display.
        setCarry(carryIn ? String(Math.abs(Math.round(carryIn))) : '')
        setCarryDirection(carryIn < 0 ? 'subtract' : 'add')
    }, [isOpen, goal, periodId])

    const signedCarry =
        (Number.parseFloat(carry) || 0) *
        (carryDirection === 'subtract' ? -1 : 1)
    const needed = Math.max((Number.parseFloat(target) || 0) + signedCarry, 0)
    const latestProgress =
        !periodId && latest && goal ? periodProgress(goal.kind, latest) : null

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (!startsOn || !endsOn) return setError('Pick a start and end date')
        if (endsOn < startsOn)
            return setError('The end date must be after the start date')
        if (!target || Number.parseFloat(target) <= 0)
            return setError('Enter a target above zero')
        setError(null)
        saveMutation.mutate(
            {
                startsOn: format(startsOn, 'yyyy-MM-dd'),
                endsOn: format(endsOn, 'yyyy-MM-dd'),
                targetAmount: Math.round(
                    convertAmountToMilliunits(Number.parseFloat(target))
                ),
                carryIn: Math.round(convertAmountToMilliunits(signedCarry)),
                label: label.trim() || null,
            },
            { onSuccess: onClose }
        )
    }

    const handleDelete = async () => {
        if (!(await confirm())) return
        deleteMutation.mutate(undefined, { onSuccess: onClose })
    }

    const isPending = saveMutation.isPending || deleteMutation.isPending

    return (
        <>
            <ConfirmDialog />
            <Sheet open={isOpen || isPending} onOpenChange={onClose}>
                <SheetContent className="space-y-4">
                    <SheetHeader>
                        <SheetTitle>
                            {periodId ? 'Edit period' : 'Next period'}
                        </SheetTitle>
                        <SheetDescription>
                            {periodId
                                ? 'Adjust the dates, target or carried amount.'
                                : `Set the next round for ${goal?.name ?? 'this goal'}.`}
                        </SheetDescription>
                    </SheetHeader>

                    {!goal ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 pt-2"
                        >
                            {latestProgress && latest && (
                                <div className="rounded-md bg-muted p-3 text-sm">
                                    <p className="font-medium">
                                        {latest.label || periodLabel(latest)}
                                        {latestProgress.isPast
                                            ? ' ended'
                                            : ' so far'}
                                    </p>
                                    <p className="text-muted-foreground tabular-nums">
                                        {formatCurrency(latestProgress.done)} of{' '}
                                        {formatCurrency(
                                            latestProgress.required
                                        )}
                                        {!latestProgress.isPast &&
                                            '. The carried amount below uses progress so far.'}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Dates</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <DatePicker
                                        value={startsOn}
                                        onChange={(d) => setStartsOn(d)}
                                    />
                                    <DatePicker
                                        value={endsOn}
                                        onChange={(d) => setEndsOn(d)}
                                    />
                                </div>
                                {startsOn && endsOn && endsOn >= startsOn && (
                                    <p className="text-sm text-muted-foreground">
                                        {periodLabel({ startsOn, endsOn })}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={ids.target}>Target</Label>
                                <MoneyInput
                                    id={ids.target}
                                    value={target}
                                    onChange={setTarget}
                                    className="h-12 text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={ids.carry}>
                                    Carried from before
                                </Label>
                                <Segmented
                                    label="Carried amount direction"
                                    value={carryDirection}
                                    onChange={setCarryDirection}
                                    options={[
                                        {
                                            value: 'add',
                                            label:
                                                goal.kind === 'allowance'
                                                    ? 'Add unspent'
                                                    : 'Add shortfall',
                                        },
                                        {
                                            value: 'subtract',
                                            label:
                                                goal.kind === 'allowance'
                                                    ? 'Take off overspend'
                                                    : 'Take off surplus',
                                        },
                                    ]}
                                    className="w-full"
                                />
                                <MoneyInput
                                    id={ids.carry}
                                    value={carry}
                                    onChange={setCarry}
                                />
                                <p className="text-sm text-muted-foreground tabular-nums">
                                    {goal.kind === 'allowance'
                                        ? 'Budget'
                                        : 'Needed'}{' '}
                                    this period:{' '}
                                    <span className="font-medium text-foreground">
                                        {formatCurrency(needed)}
                                    </span>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={ids.label}>
                                    Name (optional)
                                </Label>
                                <Input
                                    id={ids.label}
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    placeholder={
                                        startsOn && endsOn && endsOn >= startsOn
                                            ? periodLabel({ startsOn, endsOn })
                                            : 'e.g. H2 with bonus'
                                    }
                                />
                            </div>

                            {error && (
                                <p className="text-sm text-destructive">
                                    {error}
                                </p>
                            )}

                            <div className="space-y-2 pt-2">
                                <Button
                                    className="w-full"
                                    size="lg"
                                    disabled={isPending}
                                >
                                    {periodId ? 'Save period' : 'Start period'}
                                </Button>
                                {periodId && (
                                    <Button
                                        type="button"
                                        variant="destructive-ghost"
                                        className="w-full"
                                        disabled={isPending}
                                        onClick={handleDelete}
                                    >
                                        <Trash2 className="size-4" />
                                        Delete period
                                    </Button>
                                )}
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>
        </>
    )
}
