/* eslint-disable max-lines */
'use client'

import React, { type FC, useState, useEffect, useRef } from 'react'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Calendar } from './calendar'
import { DateInput } from './date-input'
import { Label } from './label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './select'
import { cn } from '@/lib/utils'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'

export interface DateRangePickerProps {
    /** Click handler for applying the updates from DateRangePicker. */
    onUpdate?: (values: { range: DateRange }) => void
    /** Initial value for start date */
    initialDateFrom?: Date | string
    /** Initial value for end date */
    initialDateTo?: Date | string
    /** Alignment of popover */
    align?: 'start' | 'center' | 'end'
    /** Option for locale */
    locale?: string
}

const formatDate = (date: Date, locale: string = 'en-us'): string => {
    return date.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

const getDateAdjustedForTimezone = (dateInput: Date | string): Date => {
    if (typeof dateInput === 'string') {
        // Split the date string to get year, month, and day parts
        const parts = dateInput.split('-').map((part) => parseInt(part, 10))
        // Create a new Date object using the local timezone
        // Note: Month is 0-indexed, so subtract 1 from the month part
        const date = new Date(parts[0], parts[1] - 1, parts[2])
        return date
    } else {
        // If dateInput is already a Date object, return it directly
        return dateInput
    }
}

interface DateRange {
    from: Date
    to: Date | undefined
}

interface Preset {
    name: string
    label: string
}

// Define presets
const PRESETS: Preset[] = [
    { name: 'last7', label: 'Last 7 days' },
    { name: 'last14', label: 'Last 14 days' },
    { name: 'last30', label: 'Last 30 days' },
    { name: 'thisMonth', label: 'This Month' },
    { name: 'lastMonth', label: 'Last Month' },
    { name: 'nextMonth', label: 'Next Month' },
    { name: 'thisYear', label: 'This Year' },
    { name: 'lastYear', label: 'Last Year' },
]

/** The DateRangePicker component allows a user to select a range of dates */
export const DateRangePicker: FC<DateRangePickerProps> = ({
    initialDateFrom = new Date(new Date().setHours(0, 0, 0, 0)),
    initialDateTo,
    onUpdate,
    align = 'end',
    locale = 'en-US',
}): React.ReactElement => {
    const [isOpen, setIsOpen] = useState(false)

    const [range, setRange] = useState<DateRange>({
        from: getDateAdjustedForTimezone(initialDateFrom),
        to: initialDateTo
            ? getDateAdjustedForTimezone(initialDateTo)
            : getDateAdjustedForTimezone(initialDateFrom),
    })

    // Keep range in sync with props when they change (e.g., URL changes)
    useEffect(() => {
        setRange({
            from: getDateAdjustedForTimezone(initialDateFrom),
            to: initialDateTo
                ? getDateAdjustedForTimezone(initialDateTo)
                : getDateAdjustedForTimezone(initialDateFrom),
        })
    }, [initialDateFrom, initialDateTo])

    const openedRangeRef = useRef<DateRange | undefined>(undefined)

    const [selectedPreset, setSelectedPreset] = useState<string | undefined>(
        undefined
    )

    const [isSmallScreen, setIsSmallScreen] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 960 : false
    )

    useEffect(() => {
        const handleResize = (): void => {
            setIsSmallScreen(window.innerWidth < 960)
        }

        window.addEventListener('resize', handleResize)

        // Clean up event listener on unmount
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    const getPresetRange = (presetName: string): DateRange => {
        const preset = PRESETS.find(({ name }) => name === presetName)
        if (!preset) throw new Error(`Unknown date range preset: ${presetName}`)
        const from = new Date()
        const to = new Date()
        const first = from.getDate() - from.getDay()

        switch (preset.name) {
            case 'today':
                from.setHours(0, 0, 0, 0)
                to.setHours(23, 59, 59, 999)
                break
            case 'yesterday':
                from.setDate(from.getDate() - 1)
                from.setHours(0, 0, 0, 0)
                to.setDate(to.getDate() - 1)
                to.setHours(23, 59, 59, 999)
                break
            case 'last7':
                from.setDate(from.getDate() - 6)
                from.setHours(0, 0, 0, 0)
                to.setHours(23, 59, 59, 999)
                break
            case 'last14':
                from.setDate(from.getDate() - 13)
                from.setHours(0, 0, 0, 0)
                to.setHours(23, 59, 59, 999)
                break
            case 'last30':
                from.setDate(from.getDate() - 29)
                from.setHours(0, 0, 0, 0)
                to.setHours(23, 59, 59, 999)
                break

            case 'nextMonth':
                from.setMonth(from.getMonth() + 1)
                from.setDate(1)
                from.setHours(0, 0, 0, 0)
                to.setMonth(to.getMonth() + 2)
                to.setDate(0)
                to.setHours(23, 59, 59, 999)
                break
            case 'thisMonth':
                from.setDate(1)
                from.setHours(0, 0, 0, 0)
                to.setHours(23, 59, 59, 999)
                break
            case 'lastMonth':
                from.setMonth(from.getMonth() - 1)
                from.setDate(1)
                from.setHours(0, 0, 0, 0)
                to.setDate(0)
                to.setHours(23, 59, 59, 999)
                break
            case 'thisYear':
                from.setMonth(0)
                from.setDate(1)
                from.setHours(0, 0, 0, 0)
                to.setHours(23, 59, 59, 999)
                break
            case 'lastYear':
                from.setFullYear(from.getFullYear() - 1)
                from.setMonth(0)
                from.setDate(1)
                from.setHours(0, 0, 0, 0)
                to.setFullYear(to.getFullYear() - 1)
                to.setMonth(11)
                to.setDate(31)
                to.setHours(23, 59, 59, 999)
                break
                to.setDate(0)
                to.setHours(23, 59, 59, 999)
                break
        }

        return { from, to }
    }

    const setPreset = (preset: string): void => {
        const range = getPresetRange(preset)
        setRange(range)
    }

    const checkPreset = (): void => {
        for (const preset of PRESETS) {
            const presetRange = getPresetRange(preset.name)

            const normalizedRangeFrom = new Date(range.from)
            normalizedRangeFrom.setHours(0, 0, 0, 0)
            const normalizedPresetFrom = new Date(
                presetRange.from.setHours(0, 0, 0, 0)
            )

            const normalizedRangeTo = new Date(range.to ?? 0)
            normalizedRangeTo.setHours(0, 0, 0, 0)
            const normalizedPresetTo = new Date(
                presetRange.to?.setHours(0, 0, 0, 0) ?? 0
            )

            if (
                normalizedRangeFrom.getTime() ===
                    normalizedPresetFrom.getTime() &&
                normalizedRangeTo.getTime() === normalizedPresetTo.getTime()
            ) {
                setSelectedPreset(preset.name)
                return
            }
        }

        setSelectedPreset(undefined)
    }

    const resetValues = (): void => {
        setRange({
            from:
                typeof initialDateFrom === 'string'
                    ? getDateAdjustedForTimezone(initialDateFrom)
                    : initialDateFrom,
            to: initialDateTo
                ? typeof initialDateTo === 'string'
                    ? getDateAdjustedForTimezone(initialDateTo)
                    : initialDateTo
                : typeof initialDateFrom === 'string'
                  ? getDateAdjustedForTimezone(initialDateFrom)
                  : initialDateFrom,
        })
    }

    useEffect(() => {
        checkPreset()
    }, [range])

    const PresetButton = ({
        preset,
        label,
        isSelected,
    }: {
        preset: string
        label: string
        isSelected: boolean
    }): React.ReactElement => (
        <Button
            className={cn(isSelected && 'pointer-events-none')}
            variant="ghost"
            onClick={() => {
                setPreset(preset)
            }}
        >
            <>
                <span
                    className={cn('pr-2 opacity-0', isSelected && 'opacity-70')}
                >
                    <CheckIcon width={18} height={18} />
                </span>
                {label}
            </>
        </Button>
    )

    // Helper function to check if two date ranges are equal
    const areRangesEqual = (a?: DateRange, b?: DateRange): boolean => {
        if (!a || !b) return a === b // If either is undefined, return true if both are undefined
        return (
            a.from.getTime() === b.from.getTime() &&
            (!a.to || !b.to || a.to.getTime() === b.to.getTime())
        )
    }

    useEffect(() => {
        if (isOpen) {
            openedRangeRef.current = range
        }
    }, [isOpen])

    return (
        <Popover
            modal={true}
            open={isOpen}
            onOpenChange={(open: boolean) => {
                if (!open) {
                    resetValues()
                }
                setIsOpen(open)
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    size={'lg'}
                    variant="outline"
                    className="lg:w-auto w-full h-9 rounded-md px-3 font-normal bg-white/10 hover:bg-white/30 hover:text-white border-none focus:ring-offset-0 focus:ring-transparent outline-none text-white focus:bg-white/30 transition"
                >
                    <div className="text-right">
                        <div className="py-1">
                            <div>{`${formatDate(range.from, locale)}${
                                range.to != null
                                    ? ' - ' + formatDate(range.to, locale)
                                    : ''
                            }`}</div>
                        </div>
                    </div>
                    <div>
                        {isOpen ? (
                            <ChevronUpIcon className="ml-2 size-4 opacity-50" />
                        ) : (
                            <ChevronDownIcon className="ml-2 size-4 opacity-50" />
                        )}
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent align={align} className="w-auto">
                <div className="flex">
                    <div className="flex">
                        <div className="flex flex-col">
                            {!isSmallScreen && (
                                <div className="flex flex-row gap-2 px-3 justify-center items-start pb-2">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <DateInput
                                                value={range.from}
                                                onChange={(date) => {
                                                    const toDate =
                                                        range.to == null ||
                                                        date > range.to
                                                            ? date
                                                            : range.to
                                                    setRange((prevRange) => ({
                                                        ...prevRange,
                                                        from: date,
                                                        to: toDate,
                                                    }))
                                                }}
                                            />
                                            <div className="py-1">-</div>
                                            <DateInput
                                                value={range.to}
                                                onChange={(date) => {
                                                    const fromDate =
                                                        date < range.from
                                                            ? date
                                                            : range.from
                                                    setRange((prevRange) => ({
                                                        ...prevRange,
                                                        from: fromDate,
                                                        to: date,
                                                    }))
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {isSmallScreen && (
                                <Select
                                    defaultValue={selectedPreset}
                                    onValueChange={(value) => {
                                        setPreset(value)
                                    }}
                                >
                                    <SelectTrigger className="w-[180px] mx-auto mb-2">
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRESETS.map((preset) => (
                                            <SelectItem
                                                key={preset.name}
                                                value={preset.name}
                                            >
                                                {preset.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            <div>
                                <Calendar
                                    mode="range"
                                    onSelect={(
                                        value:
                                            | { from?: Date; to?: Date }
                                            | undefined
                                    ) => {
                                        if (value?.from != null) {
                                            setRange({
                                                from: value.from,
                                                to: value?.to,
                                            })
                                        }
                                    }}
                                    selected={range}
                                    numberOfMonths={isSmallScreen ? 1 : 2}
                                    defaultMonth={
                                        new Date(
                                            new Date().setMonth(
                                                new Date().getMonth() -
                                                    (isSmallScreen ? 0 : 1)
                                            )
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    {!isSmallScreen && (
                        <div className="flex  flex-col items-end gap-1">
                            <div className="flex w-full border rounded-md flex-col items-end gap-1">
                                {PRESETS.map((preset) => (
                                    <PresetButton
                                        key={preset.name}
                                        preset={preset.name}
                                        label={preset.label}
                                        isSelected={
                                            selectedPreset === preset.name
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 pt-2 pr-1">
                    <Button
                        onClick={() => {
                            setIsOpen(false)
                            resetValues()
                        }}
                        variant="ghost"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            setIsOpen(false)
                            if (
                                !areRangesEqual(range, openedRangeRef.current)
                            ) {
                                onUpdate?.({ range })
                            }
                        }}
                    >
                        Update
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

DateRangePicker.displayName = 'DateRangePicker'
