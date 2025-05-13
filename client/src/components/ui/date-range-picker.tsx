import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (value: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} -{" "}
                  {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Update the DatePickerWithRange component for better form integration
interface DatePickerWithRangeProps {
  selected: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
  className?: string;
}

export function DatePickerWithRange({
  selected,
  onSelect,
  className,
}: DatePickerWithRangeProps) {
  // Track our internal date state separately from the form's state
  const [date, setDate] = React.useState<DateRange | undefined>(selected && selected.from ? selected : undefined);
  const [open, setOpen] = React.useState(false);

  // Sync with external selected value when it changes
  React.useEffect(() => {
    if (selected && selected.from) {
      setDate(selected);
    }
  }, [selected]);

  // Handle date change and ensure it's properly propagated
  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    
    // Always update the parent component with the selected date(s)
    onSelect(newDate);
    
    // Only close popover when both dates are selected
    if (newDate?.from && newDate?.to) {
      setOpen(false);
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            onClick={() => setOpen(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "MMM dd, yyyy")} -{" "}
                  {format(date.to, "MMM dd, yyyy")}
                </>
              ) : (
                <>
                  {format(date.from, "MMM dd, yyyy")} - <span className="text-muted-foreground">Select end date</span>
                </>
              )
            ) : (
              <span>Select check-in and check-out dates</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b border-border">
            <h3 className="text-sm font-medium">Select your dates</h3>
            {date?.from && !date?.to && (
              <p className="text-xs text-muted-foreground mt-1">
                Now select your check-out date
              </p>
            )}
            {!date?.from && (
              <p className="text-xs text-muted-foreground mt-1">
                First select your check-in date
              </p>
            )}
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={new Date()}
            selected={date}
            onSelect={handleDateChange}
            numberOfMonths={2}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            showOutsideDays={true}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
} 