import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { type SelectSingleEventHandler } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type DatePickerProps = {
    value?: Date
    onChange?: SelectSingleEventHandler
    disabled?: boolean
}

export const DatePicker = ({ value, onChange, disabled }: DatePickerProps) => {
    return (
        <Popover modal={true}>
            <PopoverTrigger asChild>
                <Button
                    disabled={disabled}
                    variant="outline"
                    className={cn(
                        'w-full justify-start text-left font-normal',
                        !value && 'text-muted-foreground'
                    )}
                >
                    <CalendarIcon className="size-4 mr-2" />
                    {value ? format(value, 'PPP') : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>

            <PopoverContent>
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={onChange}
                    disabled={disabled}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}
