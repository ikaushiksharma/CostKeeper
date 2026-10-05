import { format } from 'date-fns'
import { Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useId, useState } from 'react'

import { DatePicker } from '@/components/date-picker'
import { MoneyInput } from '@/components/money-input'
import { Select as CreatableSelect } from '@/components/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { useCreateAccount } from '@/features/accounts/api/use-create-account'
import { useGetAccounts } from '@/features/accounts/api/use-get-accounts'
import { useConfirm } from '@/hooks/use-confirm'
import {
    CADENCE_LABEL,
    CARRY_LABEL,
    cadenceRange,
    DEFAULT_CARRY,
    type GoalCadence,
    type GoalCarry,
    type GoalKind,
    KIND_COPY,
    periodLabel,
} from '@/lib/goals'
import { cn, convertAmountToMilliunits } from '@/lib/utils'
import { useCreateGoal } from '../api/use-create-goal'
import { useDeleteGoal } from '../api/use-delete-goal'
import { useEditGoal } from '../api/use-edit-goal'
import { useGetGoal } from '../api/use-get-goal'
import { useGoalSheet } from '../hooks/use-goal-sheet'

const KINDS: GoalKind[] = ['save', 'payoff', 'allowance']
const CADENCES: GoalCadence[] = [
    'month',
    'quarter',
    'half_year',
    'year',
    'custom',
]
const CARRIES: GoalCarry[] = ['both', 'shortfall', 'surplus', 'none']

const TARGET_LABEL: Record<GoalKind, string> = {
    save: 'Target for this period',
    payoff: 'Amount to pay this period',
    allowance: 'Budget for this period',
}

type Errors = Partial<Record<'name' | 'target' | 'dates', string>>

export const GoalSheet = () => {
    const { isOpen, id, onClose } = useGoalSheet()
    const isEdit = !!id
    const router = useRouter()
    const ids = { name: useId(), target: useId() }

    const goalQuery = useGetGoal(id)
    const accountsQuery = useGetAccounts()
    const accountMutation = useCreateAccount()
    const createMutation = useCreateGoal()
    const editMutation = useEditGoal(id)
    const deleteMutation = useDeleteGoal(id)

    const [ConfirmDialog, confirm] = useConfirm(
        'Delete this goal?',
        'Its periods are removed. Contributions stay in your ledger as ordinary transactions.',
        { confirmLabel: 'Delete', destructive: true }
    )

    const initialRange = cadenceRange('half_year')
    const [kind, setKind] = useState<GoalKind>('save')
    const [name, setName] = useState('')
    const [cadence, setCadence] = useState<GoalCadence>('half_year')
    const [carryOver, setCarryOver] = useState<GoalCarry>(DEFAULT_CARRY.save)
    const [carryTouched, setCarryTouched] = useState(false)
    const [accountId, setAccountId] = useState<string | undefined>()
    const [target, setTarget] = useState('')
    const [startsOn, setStartsOn] = useState<Date | undefined>(
        initialRange.startsOn
    )
    const [endsOn, setEndsOn] = useState<Date | undefined>(initialRange.endsOn)
    const [errors, setErrors] = useState<Errors>({})

    // Reset on open; load the goal when editing.
    useEffect(() => {
        if (!isOpen) return
        setErrors({})
        const goal = goalQuery.data
        if (isEdit && goal) {
            setKind(goal.kind)
            setName(goal.name)
            setCadence(goal.cadence)
            setCarryOver(goal.carryOver)
            setCarryTouched(true)
            setAccountId(goal.accountId ?? undefined)
        } else if (!isEdit) {
            const range = cadenceRange('half_year')
            setKind('save')
            setName('')
            setCadence('half_year')
            setCarryOver(DEFAULT_CARRY.save)
            setCarryTouched(false)
            setAccountId(undefined)
            setTarget('')
            setStartsOn(range.startsOn)
            setEndsOn(range.endsOn)
        }
    }, [isOpen, isEdit, goalQuery.data])

    const pickKind = (next: GoalKind) => {
        setKind(next)
        if (!carryTouched) setCarryOver(DEFAULT_CARRY[next])
    }

    const pickCadence = (next: GoalCadence) => {
        setCadence(next)
        if (!isEdit && next !== 'custom') {
            const range = cadenceRange(next)
            setStartsOn(range.startsOn)
            setEndsOn(range.endsOn)
        }
    }

    const accountOptions = (accountsQuery.data ?? []).map((a) => ({
        label: a.name,
        value: a.id,
    }))

    const isPending =
        createMutation.isPending ||
        editMutation.isPending ||
        deleteMutation.isPending ||
        accountMutation.isPending

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        const next: Errors = {}
        if (!name.trim()) next.name = 'Give the goal a name'
        if (!isEdit) {
            if (!target || Number.parseFloat(target) <= 0)
                next.target = 'Enter an amount above zero'
            if (!startsOn || !endsOn) next.dates = 'Pick a start and end date'
            else if (endsOn < startsOn)
                next.dates = 'The end date must be after the start date'
        }
        setErrors(next)
        if (Object.keys(next).length) return

        if (isEdit) {
            editMutation.mutate(
                {
                    name: name.trim(),
                    kind,
                    cadence,
                    carryOver,
                    accountId: accountId ?? null,
                },
                { onSuccess: onClose }
            )
            return
        }

        createMutation.mutate(
            {
                name: name.trim(),
                kind,
                cadence,
                carryOver,
                accountId: accountId ?? null,
                period: {
                    startsOn: format(startsOn as Date, 'yyyy-MM-dd'),
                    endsOn: format(endsOn as Date, 'yyyy-MM-dd'),
                    targetAmount: Math.round(
                        convertAmountToMilliunits(Number.parseFloat(target))
                    ),
                },
            },
            {
                onSuccess: (data) => {
                    onClose()
                    router.push(`/goals/${data.id}`)
                },
            }
        )
    }

    const handleDelete = async () => {
        if (!(await confirm())) return
        deleteMutation.mutate(undefined, {
            onSuccess: () => {
                onClose()
                router.push('/goals')
            },
        })
    }

    return (
        <>
            <ConfirmDialog />
            <Sheet open={isOpen || isPending} onOpenChange={onClose}>
                <SheetContent className="space-y-4">
                    <SheetHeader>
                        <SheetTitle>
                            {isEdit ? 'Edit goal' : 'New goal'}
                        </SheetTitle>
                        <SheetDescription>
                            {isEdit
                                ? 'Change how this goal works. Targets are edited per period.'
                                : 'Set a target for a period and log what you put toward it.'}
                        </SheetDescription>
                    </SheetHeader>

                    {isEdit && goalQuery.isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 pt-2"
                        >
                            <fieldset className="space-y-2">
                                <legend className="mb-2 text-sm font-medium">
                                    What kind of goal?
                                </legend>
                                <div className="grid gap-2">
                                    {KINDS.map((option) => (
                                        <label
                                            key={option}
                                            className={cn(
                                                'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors hover:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                                                kind === option &&
                                                    'border-brand bg-brand-soft/60 hover:bg-brand-soft/60'
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="goal-kind"
                                                value={option}
                                                checked={kind === option}
                                                onChange={() =>
                                                    pickKind(option)
                                                }
                                                className="mt-1 accent-[hsl(var(--brand))]"
                                            />
                                            <span className="space-y-0.5">
                                                <span className="block text-sm font-medium">
                                                    {KIND_COPY[option].label}
                                                </span>
                                                <span className="block text-sm text-muted-foreground">
                                                    {
                                                        KIND_COPY[option]
                                                            .description
                                                    }
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>

                            <div className="space-y-2">
                                <Label htmlFor={ids.name}>Name</Label>
                                <Input
                                    id={ids.name}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={
                                        kind === 'payoff'
                                            ? 'e.g. Education loan'
                                            : kind === 'allowance'
                                              ? 'e.g. Trips'
                                              : 'e.g. Mutual funds'
                                    }
                                    aria-invalid={!!errors.name}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Repeats</Label>
                                <Select
                                    value={cadence}
                                    onValueChange={(v) =>
                                        pickCadence(v as GoalCadence)
                                    }
                                >
                                    <SelectTrigger aria-label="Repeats">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CADENCES.map((c) => (
                                            <SelectItem key={c} value={c}>
                                                {CADENCE_LABEL[c]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {!isEdit && (
                                <>
                                    <div className="space-y-2">
                                        <Label>First period</Label>
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
                                        <p className="text-sm text-muted-foreground">
                                            {errors.dates ? (
                                                <span className="text-destructive">
                                                    {errors.dates}
                                                </span>
                                            ) : (
                                                startsOn &&
                                                endsOn &&
                                                endsOn >= startsOn &&
                                                periodLabel({
                                                    startsOn,
                                                    endsOn,
                                                })
                                            )}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor={ids.target}>
                                            {TARGET_LABEL[kind]}
                                        </Label>
                                        <MoneyInput
                                            id={ids.target}
                                            value={target}
                                            onChange={setTarget}
                                            className="h-12 text-lg"
                                            aria-invalid={!!errors.target}
                                        />
                                        {errors.target && (
                                            <p className="text-sm text-destructive">
                                                {errors.target}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <Label>Default account</Label>
                                <CreatableSelect
                                    placeholder="Pick one later"
                                    options={accountOptions}
                                    value={accountId}
                                    onChange={setAccountId}
                                    onCreate={(accountName) =>
                                        accountMutation.mutate(
                                            { name: accountName },
                                            {
                                                onSuccess: (res) => {
                                                    if ('data' in res)
                                                        setAccountId(
                                                            res.data.id
                                                        )
                                                },
                                            }
                                        )
                                    }
                                    disabled={isPending}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Where contributions come from unless you
                                    pick another.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>When a period ends</Label>
                                <Select
                                    value={carryOver}
                                    onValueChange={(v) => {
                                        setCarryOver(v as GoalCarry)
                                        setCarryTouched(true)
                                    }}
                                >
                                    <SelectTrigger aria-label="When a period ends">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CARRIES.map((c) => (
                                            <SelectItem key={c} value={c}>
                                                {CARRY_LABEL[c]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-muted-foreground">
                                    {kind === 'allowance'
                                        ? 'Surplus is money left unspent; shortfall is overspending.'
                                        : 'Shortfall is what you missed; surplus is what you put in beyond the target.'}
                                </p>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Button
                                    className="w-full"
                                    size="lg"
                                    disabled={isPending}
                                >
                                    {isEdit ? 'Save changes' : 'Create goal'}
                                </Button>
                                {isEdit && (
                                    <Button
                                        type="button"
                                        variant="destructive-ghost"
                                        className="w-full"
                                        disabled={isPending}
                                        onClick={handleDelete}
                                    >
                                        <Trash2 className="size-4" />
                                        Delete goal
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
