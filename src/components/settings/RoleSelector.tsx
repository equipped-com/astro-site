/**
 * Role Selector Component
 *
 * Dropdown for selecting account roles with permission descriptions.
 */

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

export type Role = 'owner' | 'admin' | 'member' | 'buyer' | 'viewer' | 'noaccess'

interface RoleOption {
	value: Role
	label: string
	description: string
}

interface RoleSelectorProps {
	value: Role
	onChange: (role: Role) => void
	disabled?: boolean
	canAssignOwner?: boolean
}

const roleOptions: RoleOption[] = [
	{
		value: 'owner',
		label: 'Owner',
		description: 'Full control including billing and account deletion',
	},
	{
		value: 'admin',
		label: 'Admin',
		description: 'Manage devices, users, and orders',
	},
	{
		value: 'member',
		label: 'Member',
		description: 'Read-only access to devices and orders',
	},
	{
		value: 'buyer',
		label: 'Buyer',
		description: 'Access to store, orders, and invoices only',
	},
	{
		value: 'viewer',
		label: 'Viewer',
		description: 'View-only access (no actions)',
	},
	{
		value: 'noaccess',
		label: 'No Access',
		description: 'Cannot log in to this account',
	},
]

function RoleSelector({ value, onChange, disabled = false, canAssignOwner = true }: RoleSelectorProps) {
	const [isOpen, setIsOpen] = useState(false)

	const selectedOption = roleOptions.find(opt => opt.value === value)
	const availableOptions = canAssignOwner ? roleOptions : roleOptions.filter(opt => opt.value !== 'owner')

	function handleSelect(role: Role) {
		onChange(role)
		setIsOpen(false)
	}

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => !disabled && setIsOpen(!isOpen)}
				disabled={disabled}
				className="w-full min-w-[200px] px-4 py-2 border rounded-lg text-left flex items-center justify-between hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<span className="font-medium">{selectedOption?.label || 'Select Role'}</span>
				<ChevronDown size={16} className={isOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
			</button>

			{isOpen && (
				<>
					<div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} onKeyDown={() => {}} />
					<div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
						{availableOptions.map(option => (
							<button
								key={option.value}
								type="button"
								onClick={() => handleSelect(option.value)}
								className={`w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b last:border-b-0 ${
									value === option.value ? 'bg-primary/5 border-l-2 border-l-primary' : ''
								}`}
							>
								<div className="font-medium">{option.label}</div>
								<div className="text-sm text-muted-foreground mt-1">{option.description}</div>
							</button>
						))}
					</div>
				</>
			)}
		</div>
	)
}

export default RoleSelector
