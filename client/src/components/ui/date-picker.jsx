import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, CalendarDays } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

function DatePicker({ selected, onSelect, placeholder = "Pick a date", className, ...props }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-slate-500",
            className
          )}
          {...props}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {selected ? format(selected, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 shadow-lg border border-slate-200" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onSelect(date)
            setOpen(false)
          }}
          initialFocus
          className="rounded-md"
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
