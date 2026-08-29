'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { format, addDays, addWeeks, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerBarProps {
  date: Date;
  onChange: (date: Date) => void;
}

export function DatePickerBar({ date, onChange }: DatePickerBarProps) {
  const [open, setOpen] = useState(false);
  const isToday = isSameDay(date, new Date());

  return (
    <div className="flex items-center gap-1.5">
      {/* Previous week */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => onChange(addWeeks(date, -1))}
        title="前週へ"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>

      {/* Previous day */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => onChange(addDays(date, -1))}
        title="前日へ"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Calendar picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`h-9 gap-2 ${!isToday ? 'border-sky-300 bg-sky-50/50 dark:border-sky-800 dark:bg-sky-950/20' : ''}`}
          >
            <CalendarDays className="h-4 w-4" />
            <span className="min-w-[140px] text-left">
              {isToday
                ? '今日'
                : format(date, 'yyyy年M月d日(E)', { locale: ja })}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (d) {
                onChange(d);
                setOpen(false);
              }
            }}
            locale={ja}
          />
          <div className="border-t border-border/60 p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange(new Date());
                setOpen(false);
              }}
            >
              今日に戻る
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Next day */}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={() => onChange(addDays(date, 1))}
        title="翌日へ"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Next week */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => onChange(addWeeks(date, 1))}
        title="翌週へ"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
