'use client'

import * as React from 'react'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { SelectSingleEventHandler } from 'react-day-picker'

type DatePickerProps = {
    value?: Date
    onChange?: any
    disabled?: boolean
}

export function DateTimePicker({ value, onChange, disabled }: DatePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false)

    const hours = Array.from({ length: 12 }, (_, i) => i + 1)

    const handleTimeChange = (
        type: 'hour' | 'minute' | 'ampm',
        val: string
    ) => {
        if (value) {
            const newDate = new Date(value)
            if (type === 'hour') {
                newDate.setHours(
                    (parseInt(val) % 12) + (newDate.getHours() >= 12 ? 12 : 0)
                )
            } else if (type === 'minute') {
                newDate.setMinutes(parseInt(val))
            } else if (type === 'ampm') {
                const currentHours = newDate.getHours()
                newDate.setHours(
                    val === 'PM' ? currentHours + 12 : currentHours - 12
                )
            }
            onChange(newDate)
        }
    }

    const handleDateChange: SelectSingleEventHandler = (date) => {
        if (date) {
            const newDate = new Date(date)
            if (value) {
                newDate.setHours(value.getHours())
                newDate.setMinutes(value.getMinutes())
            }
            onChange(newDate)
            setIsOpen(false)
        }
    }
    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'w-full justify-start text-left font-normal',
                        !value && 'text-muted-foreground'
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? (
                        format(value, 'dd/MM/yyyy hh:mm aa')
                    ) : (
                        <span>Pick a date</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <div className="sm:flex">
                    <Calendar
                        mode="single"
                        selected={value}
                        disabled={disabled}
                        onSelect={handleDateChange}
                        initialFocus
                    />
                    <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                        <ScrollArea className="w-64 sm:w-auto">
                            <div className="flex sm:flex-col p-2">
                                {hours.reverse().map((hour) => (
                                    <Button
                                        key={hour}
                                        size="icon"
                                        variant={
                                            value &&
                                            value.getHours() % 12 === hour % 12
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        className="sm:w-full shrink-0 aspect-square"
                                        onClick={() =>
                                            handleTimeChange(
                                                'hour',
                                                hour.toString()
                                            )
                                        }
                                    >
                                        {hour}
                                    </Button>
                                ))}
                            </div>
                            <ScrollBar
                                orientation="horizontal"
                                className="sm:hidden"
                            />
                        </ScrollArea>
                        <ScrollArea className="w-64 sm:w-auto">
                            <div className="flex sm:flex-col p-2">
                                {Array.from(
                                    { length: 12 },
                                    (_, i) => i * 5
                                ).map((minute) => (
                                    <Button
                                        key={minute}
                                        size="icon"
                                        variant={
                                            value &&
                                            value.getMinutes() === minute
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        className="sm:w-full shrink-0 aspect-square"
                                        onClick={() =>
                                            handleTimeChange(
                                                'minute',
                                                minute.toString()
                                            )
                                        }
                                    >
                                        {minute}
                                    </Button>
                                ))}
                            </div>
                            <ScrollBar
                                orientation="horizontal"
                                className="sm:hidden"
                            />
                        </ScrollArea>
                        <ScrollArea className="">
                            <div className="flex sm:flex-col p-2">
                                {['AM', 'PM'].map((ampm) => (
                                    <Button
                                        key={ampm}
                                        size="icon"
                                        variant={
                                            value &&
                                            ((ampm === 'AM' &&
                                                value.getHours() < 12) ||
                                                (ampm === 'PM' &&
                                                    value.getHours() >= 12))
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        className="sm:w-full shrink-0 aspect-square"
                                        onClick={() =>
                                            handleTimeChange('ampm', ampm)
                                        }
                                    >
                                        {ampm}
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
