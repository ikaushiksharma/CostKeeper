'use client'

import { useMemo } from 'react'
import type { SingleValue } from 'react-select'
import CreatableSelect from 'react-select/creatable'

type SelectProps = {
    onChange: (value?: string) => void
    onCreate?: (value: string) => void
    options?: { label: string; value: string }[]
    value?: string | null | undefined
    disabled?: boolean
    placeholder?: string
    menuPortalTarget?: HTMLElement | null
}

export const Select = ({
    value,
    onChange,
    onCreate,
    options = [],
    disabled,
    placeholder,
    menuPortalTarget = null,
}: SelectProps) => {
    const onSelect = (
        option: SingleValue<{ label: string; value: string }>
    ) => {
        onChange(option?.value)
    }

    const isPortaledToBody =
        typeof document !== 'undefined' && menuPortalTarget === document.body

    const formattedValue = useMemo(() => {
        return options.find((option) => option.value === value)
    }, [options, value])
    return (
        <CreatableSelect
            placeholder={placeholder}
            className="text-sm"
            menuPortalTarget={menuPortalTarget}
            styles={{
                menuPortal: (base) => ({
                    ...base,
                    ...(isPortaledToBody && { zIndex: 9999 }),
                }),
                menu: (base) => ({
                    ...base,
                    ...(isPortaledToBody && { zIndex: 9999 }),
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 10,
                    boxShadow: '0 12px 32px -12px hsl(240 10% 10% / 0.25)',
                    overflow: 'hidden',
                }),
                menuList: (base) => ({
                    ...base,
                    padding: 4,
                }),
                input: (base) => ({
                    ...base,
                    color: 'hsl(var(--foreground))',
                }),
                placeholder: (base) => ({
                    ...base,
                    color: 'hsl(var(--muted-foreground))',
                }),
                singleValue: (base) => ({
                    ...base,
                    color: 'hsl(var(--foreground))',
                }),
                option: (base, { isFocused, isSelected }) => ({
                    ...base,
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: isSelected
                        ? 'hsl(var(--brand))'
                        : 'hsl(var(--popover-foreground))',
                    fontWeight: isSelected ? 500 : 400,
                    backgroundColor: isSelected
                        ? 'hsl(var(--brand-soft))'
                        : isFocused
                          ? 'hsl(var(--accent))'
                          : 'transparent',
                    ':active': { backgroundColor: 'hsl(var(--accent))' },
                }),
                control: (base, { isFocused }) => ({
                    ...base,
                    minHeight: 40,
                    borderRadius: 10,
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: isFocused
                        ? 'hsl(var(--ring))'
                        : 'hsl(var(--input))',
                    boxShadow: isFocused
                        ? '0 0 0 1px hsl(var(--ring))'
                        : 'none',
                    ':hover': {
                        borderColor: isFocused
                            ? 'hsl(var(--ring))'
                            : 'hsl(var(--input))',
                    },
                }),
                indicatorSeparator: () => ({ display: 'none' }),
            }}
            value={formattedValue}
            onChange={onSelect}
            options={options}
            onCreateOption={onCreate}
            isDisabled={disabled}
        />
    )
}
