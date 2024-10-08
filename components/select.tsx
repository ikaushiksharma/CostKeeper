'use client'

import { useTheme } from 'next-themes'
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
}

export const Select = ({
    value,
    onChange,
    onCreate,
    options = [],
    disabled,
    placeholder,
}: SelectProps) => {
    const onSelect = (
        option: SingleValue<{ label: string; value: string }>
    ) => {
        onChange(option?.value)
    }

    const formattedValue = useMemo(() => {
        return options.find((option) => option.value === value)
    }, [options, value])
    const { theme } = useTheme()
    return (
        <CreatableSelect
            placeholder={placeholder}
            className="text-sm h-10 bg-background"
            styles={{
                menuList: (base) => ({
                    ...base,
                    backgroundColor: 'hsl(var(--background))',
                }),
                input: (base) => ({
                    ...base,
                    color: 'hsl(var(--foreground))',
                }),
                singleValue(base) {
                    return {
                        ...base,
                        color: 'hsl(var(--foreground))',
                    }
                },
                option: (base, { isFocused }) => ({
                    ...base,
                    backgroundColor: isFocused
                        ? 'hsl(var(--input))'
                        : 'hsl(var(--background))',
                }),
                control: (base) => ({
                    ...base,
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--input))',
                    ':hover': {
                        borderColor: 'hsl(var(--input))',
                    },
                }),
            }}
            value={formattedValue}
            onChange={onSelect}
            options={options}
            onCreateOption={onCreate}
            isDisabled={disabled}
        />
    )
}
