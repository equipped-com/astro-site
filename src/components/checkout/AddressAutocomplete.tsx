'use client'

import { MapPin, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { AddressData } from '@/lib/address-validation'
import { cn } from '@/lib/utils'

interface AddressSuggestion {
	placeId: string
	description: string
	mainText: string
	secondaryText: string
}

interface AddressAutocompleteProps {
	value: string
	onChange: (value: string) => void
	onAddressSelect: (address: Partial<AddressData>) => void
	onManualEntry: () => void
	disabled?: boolean
	placeholder?: string
}

/**
 * Address autocomplete component with Google Places API integration
 * Falls back to manual entry if autocomplete is unavailable
 */
export default function AddressAutocomplete({
	value,
	onChange,
	onAddressSelect,
	onManualEntry,
	disabled = false,
	placeholder = 'Start typing an address...',
}: AddressAutocompleteProps) {
	const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [showSuggestions, setShowSuggestions] = useState(false)
	const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
	const placesService = useRef<google.maps.places.PlacesService | null>(null)

	// Initialize Google Places API
	useEffect(() => {
		// Check if Google Maps is loaded
		if (typeof window !== 'undefined' && window.google?.maps?.places) {
			autocompleteService.current = new window.google.maps.places.AutocompleteService()

			// PlacesService requires a DOM element
			const div = document.createElement('div')
			placesService.current = new window.google.maps.places.PlacesService(div)

			setIsGoogleLoaded(true)
		} else {
			// Google Places not loaded - user will use manual entry
			setIsGoogleLoaded(false)
		}
	}, [])

	// Fetch autocomplete suggestions
	useEffect(() => {
		if (!value.trim() || !isGoogleLoaded || !autocompleteService.current) {
			setSuggestions([])
			return
		}

		const timer = setTimeout(() => {
			setIsLoading(true)

			autocompleteService.current?.getPlacePredictions(
				{
					input: value,
					types: ['address'],
					componentRestrictions: { country: 'us' }, // US addresses only for now
				},
				(predictions, status) => {
					setIsLoading(false)

					if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
						setSuggestions(
							predictions.map(pred => ({
								placeId: pred.place_id,
								description: pred.description,
								mainText: pred.structured_formatting.main_text,
								secondaryText: pred.structured_formatting.secondary_text,
							})),
						)
						setShowSuggestions(true)
					} else {
						setSuggestions([])
					}
				},
			)
		}, 300) // Debounce 300ms

		return () => clearTimeout(timer)
	}, [value, isGoogleLoaded])

	// Handle place selection
	function handleSelectPlace(placeId: string) {
		if (!placesService.current) return

		placesService.current.getDetails(
			{
				placeId,
				fields: ['address_components', 'formatted_address'],
			},
			(place, status) => {
				if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.address_components) {
					// Parse address components
					const components = place.address_components
					const getComponent = (type: string) => components.find(c => c.types.includes(type))?.long_name || ''

					const addressData: Partial<AddressData> = {
						addressLine1: `${getComponent('street_number')} ${getComponent('route')}`.trim(),
						city: getComponent('locality') || getComponent('sublocality'),
						state: getComponent('administrative_area_level_1'),
						zipCode: getComponent('postal_code'),
						country: getComponent('country'),
					}

					onAddressSelect(addressData)
					setShowSuggestions(false)
				}
			},
		)
	}

	function handleClear() {
		onChange('')
		setSuggestions([])
		setShowSuggestions(false)
		inputRef.current?.focus()
	}

	return (
		<div className="relative w-full">
			{/* Input Field */}
			<div className="relative">
				<MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<input
					ref={inputRef}
					type="text"
					value={value}
					onChange={e => onChange(e.target.value)}
					onFocus={() => {
						if (suggestions.length > 0) setShowSuggestions(true)
					}}
					disabled={disabled}
					placeholder={placeholder}
					className={cn(
						'w-full rounded-lg border border-input bg-background',
						'pl-10 pr-10 py-3 text-sm',
						'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
						'placeholder:text-muted-foreground',
						'disabled:opacity-50 disabled:cursor-not-allowed',
					)}
				/>
				{value && (
					<button
						type="button"
						onClick={handleClear}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
					>
						<X className="h-4 w-4" />
					</button>
				)}
			</div>

			{/* Loading Indicator */}
			{isLoading && (
				<div className="absolute right-12 top-1/2 -translate-y-1/2">
					<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
				</div>
			)}

			{/* Suggestions Dropdown */}
			{showSuggestions && suggestions.length > 0 && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 z-10"
						onClick={() => setShowSuggestions(false)}
						onKeyDown={e => {
							if (e.key === 'Escape') setShowSuggestions(false)
						}}
						role="button"
						tabIndex={-1}
						aria-label="Close suggestions"
					/>

					{/* Results */}
					<div className="absolute z-20 mt-2 w-full rounded-lg border border-border bg-background shadow-lg">
						<div className="max-h-[300px] overflow-y-auto">
							{suggestions.map(suggestion => (
								<button
									key={suggestion.placeId}
									type="button"
									onClick={() => handleSelectPlace(suggestion.placeId)}
									className={cn(
										'w-full px-4 py-3 text-left transition-colors',
										'hover:bg-accent hover:text-accent-foreground',
										'border-b border-border last:border-b-0',
										'flex items-start gap-3',
									)}
								>
									<MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
									<div className="flex-1 min-w-0">
										<div className="font-medium text-sm">{suggestion.mainText}</div>
										<div className="text-xs text-muted-foreground">{suggestion.secondaryText}</div>
									</div>
								</button>
							))}
						</div>
					</div>
				</>
			)}

			{/* Manual Entry Link */}
			{!isGoogleLoaded || (value.length > 3 && suggestions.length === 0 && !isLoading) ? (
				<button type="button" onClick={onManualEntry} className="mt-2 text-sm text-primary hover:underline">
					Enter address manually
				</button>
			) : null}

			{/* No Google Places Warning */}
			{!isGoogleLoaded && (
				<p className="mt-2 text-xs text-muted-foreground">
					Address autocomplete is unavailable. Please enter your address manually.
				</p>
			)}
		</div>
	)
}
