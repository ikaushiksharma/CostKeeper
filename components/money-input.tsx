import CurrencyInput from 'react-currency-input-field'

import { cn } from '@/lib/utils'

type MoneyInputProps = {
    id?: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    'aria-invalid'?: boolean
}

// A positive rupee amount. For signed ledger entries use AmountInput instead.
export const MoneyInput = ({
    id,
    value,
    onChange,
    placeholder = '0',
    disabled,
    className,
    ...rest
}: MoneyInputProps) => (
    <CurrencyInput
        id={id}
        prefix="₹"
        inputMode="decimal"
        allowNegativeValue={false}
        decimalScale={2}
        decimalsLimit={2}
        intlConfig={{ locale: 'en-IN', currency: 'INR' }}
        value={value}
        onValueChange={(raw) => onChange(raw ?? '')}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={rest['aria-invalid']}
        className={cn(
            'flex h-10 w-full rounded-md border border-input bg-card px-3 font-mono tabular-nums ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive',
            className
        )}
    />
)
