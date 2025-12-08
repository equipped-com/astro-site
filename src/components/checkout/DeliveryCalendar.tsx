'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { getDaysInMonth, getFirstDayOfMonth, getMonthName, isDateAvailable, isSameDay } from '@/lib/delivery-dates'
import { cn } from '@/lib/utils'

interface DeliveryCalendarProps {
	selectedDate?: Date
	onDateSelect: (date: Date) => void
	baseDate?: Date
}

export default function DeliveryCalendar({ selectedDate, onDateSelect, baseDate = new Date() }: DeliveryCalendarProps) {
	const [currentMonth, setCurrentMonth] = useState(new Date())

	const year = currentMonth.getFullYear()
	const month = currentMonth.getMonth()
	const daysInMonth = getDaysInMonth(year, month)
	const firstDayOfWeek = getFirstDayOfMonth(year, month)

	function handlePreviousMonth() {
		setCurrentMonth(prev => {
			const newDate = new Date(prev)
			newDate.setMonth(prev.getMonth() - 1)
			return newDate
		})
	}

	function handleNextMonth() {
		setCurrentMonth(prev => {
			const newDate = new Date(prev)
			newDate.setMonth(prev.getMonth() + 1)
			return newDate
		})
	}

	function handleDateClick(day: number) {
		const clickedDate = new Date(year, month, day)

		if (isDateAvailable(clickedDate, baseDate)) {
			onDateSelect(clickedDate)
		}
	}

	// Build calendar grid with unique keys
	const calendarDays: Array<{ key: string; day: number | null }> = []

	// Add empty cells for days before month starts
	for (let i = 0; i < firstDayOfWeek; i++) {
		calendarDays.push({ key: `empty-${i}`, day: null })
	}

	// Add days of the month
	for (let day = 1; day <= daysInMonth; day++) {
		calendarDays.push({ key: `day-${day}`, day })
	}

	const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

	return (
		<div className="rounded-lg border border-border bg-background p-4">
			{/* Calendar Header */}
			<div className="flex items-center justify-between mb-4">
				<button
					type="button"
					onClick={handlePreviousMonth}
					className="p-1 hover:bg-accent rounded transition-colors"
					aria-label="Previous month"
				>
					<ChevronLeft className="h-5 w-5" />
				</button>

				<div className="font-semibold text-sm">{getMonthName(currentMonth)}</div>

				<button
					type="button"
					onClick={handleNextMonth}
					className="p-1 hover:bg-accent rounded transition-colors"
					aria-label="Next month"
				>
					<ChevronRight className="h-5 w-5" />
				</button>
			</div>

			{/* Week Day Headers */}
			<div className="grid grid-cols-7 gap-1 mb-2">
				{weekDays.map(day => (
					<div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
						{day}
					</div>
				))}
			</div>

			{/* Calendar Grid */}
			<div className="grid grid-cols-7 gap-1">
				{calendarDays.map(({ key, day }) => {
					if (day === null) {
						return <div key={key} className="aspect-square" />
					}

					const cellDate = new Date(year, month, day)
					const isAvailable = isDateAvailable(cellDate, baseDate)
					const isSelected = selectedDate ? isSameDay(cellDate, selectedDate) : false
					const isToday = isSameDay(cellDate, new Date())

					return (
						<button
							key={key}
							type="button"
							onClick={() => handleDateClick(day)}
							disabled={!isAvailable}
							className={cn(
								'aspect-square flex items-center justify-center rounded text-sm transition-colors',
								'hover:bg-accent',
								isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-30',
								isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
								isToday && !isSelected && 'border border-primary',
								!isSelected && !isToday && 'hover:bg-accent',
							)}
						>
							{day}
						</button>
					)
				})}
			</div>

			{/* Helper Text */}
			<div className="mt-4 pt-4 border-t border-border">
				<p className="text-xs text-muted-foreground">Select a later date that suits the person you're shipping to</p>
			</div>
		</div>
	)
}
