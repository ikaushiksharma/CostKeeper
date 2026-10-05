import { useEffect, useState } from 'react'
import CurrencyInput from 'react-currency-input-field'

import { cn } from '@/lib/utils'

type AmountInputProps = {
    value: string
    onChange: (value: string | undefined) => void
    placeholder?: string
    disabled?: boolean
    id?: string
}

type Kind = 'expense' | 'income'

// The amount is stored signed (negative = expense). Instead of asking people
// to type a minus sign, the sign is picked with an explicit toggle and the
// field only ever shows the absolute value. New entries default to expense,
// which is what most entries are.
export const AmountInput = ({
    value,
    onChange,
    placeholder,
    disabled,
    id,
}: AmountInputProps) => {
    const parsed = Number.parseFloat(value)
    const [kind, setKind] = useState<Kind>(parsed > 0 ? 'income' : 'expense')

    // Follow the sign when the value arrives from outside (edit sheet load).
    useEffect(() => {
        if (parsed > 0) setKind('income')
        else if (parsed < 0) setKind('expense')
    }, [parsed])

    const absolute = value ? value.replace(/^-/, '') : ''

    const emit = (raw: string | undefined, nextKind: Kind) => {
        if (!raw) return onChange(raw)
        onChange(nextKind === 'expense' ? `-${raw}` : raw)
    }

    const switchKind = (nextKind: Kind) => {
        setKind(nextKind)
        emit(absolute, nextKind)
    }

    return (
        <div className="space-y-2">
            <div
                role="radiogroup"
                aria-label="Transaction type"
                className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1"
            >
                {(['expense', 'income'] as const).map((option) => {
                    const active = kind === option
                    return (
                        // biome-ignore lint/a11y/useSemanticElements: styled radio group built from buttons.
                        <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            disabled={disabled}
                            onClick={() => switchKind(option)}
                            className={cn(
                                'h-8 rounded-[7px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
                                active
                                    ? 'bg-card shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground',
                                active &&
                                    (option === 'expense'
                                        ? 'text-expense'
                                        : 'text-income')
                            )}
                        >
                            {option === 'expense' ? 'Expense' : 'Income'}
                        </button>
                    )
                })}
            </div>

            <div className="relative">
                <span
                    className={cn(
                        'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-lg',
                        kind === 'expense' ? 'text-expense' : 'text-income'
                    )}
                    aria-hidden
                >
                    {kind === 'expense' ? '−' : '+'}
                </span>
                <CurrencyInput
                    id={id}
                    prefix="₹"
                    inputMode="decimal"
                    allowNegativeValue={false}
                    className="flex h-12 w-full rounded-md border border-input bg-card pl-8 pr-3 font-mono text-lg tabular-nums ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder={placeholder}
                    value={absolute}
                    decimalScale={2}
                    decimalsLimit={2}
                    intlConfig={{ locale: 'en-IN', currency: 'INR' }}
                    onValueChange={(raw) => emit(raw, kind)}
                    disabled={disabled}
                />
            </div>
        </div>
    )
}
