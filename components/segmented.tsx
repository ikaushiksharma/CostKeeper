'use client'

import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

type SegmentedOption<T extends string> = {
    value: T
    label: string
    icon?: LucideIcon
}

type SegmentedProps<T extends string> = {
    value: T
    onChange: (value: T) => void
    options: SegmentedOption<T>[]
    label: string
    iconOnly?: boolean
    className?: string
}

export function Segmented<T extends string>({
    value,
    onChange,
    options,
    label,
    iconOnly,
    className,
}: SegmentedProps<T>) {
    return (
        <div
            role="radiogroup"
            aria-label={label}
            className={cn(
                'inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-md bg-muted p-0.5 [scrollbar-width:none]',
                className
            )}
        >
            {options.map((option) => {
                const active = option.value === value
                const Icon = option.icon
                return (
                    // biome-ignore lint/a11y/useSemanticElements: a styled radio button group, keyboard focus stays on real buttons.
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={iconOnly ? option.label : undefined}
                        title={iconOnly ? option.label : undefined}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'inline-flex h-8 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px] px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            active
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {Icon && <Icon className="size-3.5" />}
                        {!iconOnly && option.label}
                    </button>
                )
            })}
        </div>
    )
}
