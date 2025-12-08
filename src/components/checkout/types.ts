// Checkout Stage 4 - Payment/Leasing types

export type PaymentMethod = 'leasing' | 'card'
export type LeaseTerm = 24 | 36
export type BankVerificationMethod = 'plaid' | 'upload'

export interface CompanyInfo {
	legalName: string
	ein: string
	contactName: string
	contactEmail: string
	address: {
		street: string
		apartment?: string
		city: string
		state: string
		zipCode: string
		country: string
	}
}

export interface PlaidLinkResult {
	publicToken: string
	accountId: string
	institutionName: string
	verified: boolean
}

export interface BankStatement {
	id: string
	fileName: string
	fileSize: number
	uploadedAt: Date
}

export interface LeaseApplication {
	companyInfo: CompanyInfo
	bankVerificationMethod: BankVerificationMethod
	plaidResult?: PlaidLinkResult
	bankStatements?: BankStatement[]
	leaseTerm: LeaseTerm
	equipmentValue: number
	monthlyPayment: number
	buyoutAmount: number
}

export interface PaymentStageProps {
	cartTotal: number
	onSubmit: (data: LeaseApplication | CardPaymentData) => Promise<void>
	onPaymentMethodChange?: (method: PaymentMethod) => void
	initialPaymentMethod?: PaymentMethod
	initialLeaseTerm?: LeaseTerm
}

export interface CompanyInfoFormProps {
	initialData?: Partial<CompanyInfo>
	onChange: (data: CompanyInfo, isValid: boolean) => void
	disabled?: boolean
}

export interface BankVerificationProps {
	method: BankVerificationMethod
	onMethodChange: (method: BankVerificationMethod) => void
	onPlaidSuccess: (result: PlaidLinkResult) => void
	onUploadComplete: (statements: BankStatement[]) => void
	plaidResult?: PlaidLinkResult
	bankStatements?: BankStatement[]
	disabled?: boolean
}

export interface PlaidConnectProps {
	onSuccess: (result: PlaidLinkResult) => void
	onError: (error: Error) => void
	disabled?: boolean
	result?: PlaidLinkResult
}

export interface BankStatementUploadProps {
	statements: BankStatement[]
	onUpload: (files: File[]) => Promise<void>
	onRemove: (id: string) => void
	disabled?: boolean
}

export interface CardPaymentData {
	paymentIntentId: string
	paymentMethodId: string
}

export interface CardPaymentFormProps {
	amount: number
	onSuccess: (data: CardPaymentData) => void
	onError: (error: Error) => void
	disabled?: boolean
}

export interface LeasingFormProps {
	cartTotal: number
	leaseTerm: LeaseTerm
	onLeaseTermChange: (term: LeaseTerm) => void
	onSubmit: (application: LeaseApplication) => Promise<void>
	disabled?: boolean
}

// Leasing calculation helpers
export function calculateMonthlyPayment(equipmentValue: number, term: LeaseTerm): number {
	// Simplified calculation - real implementation would use Macquarie's rates
	// Approximate factor: 24mo = 0.0271, 36mo = 0.0195
	const factor = term === 24 ? 0.0271 : 0.0195
	return Number((equipmentValue * factor).toFixed(2))
}

export function calculateBuyoutAmount(equipmentValue: number, term: LeaseTerm): number {
	// Buyout is typically 20-35% of original value
	// 24mo = 35% buyout, 36mo = 45% buyout (longer term = higher buyout)
	const buyoutFactor = term === 24 ? 0.35 : 0.45
	return Math.round(equipmentValue * buyoutFactor)
}

export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	}).format(amount)
}

// Form validation helpers
export function validateEIN(ein: string): boolean {
	// EIN format: XX-XXXXXXX (2 digits, hyphen, 7 digits)
	return /^\d{2}-\d{7}$/.test(ein)
}

export function validateEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateCompanyInfo(info: Partial<CompanyInfo>): string[] {
	const errors: string[] = []

	if (!info.legalName?.trim()) {
		errors.push('Company legal name is required')
	}
	if (!info.ein?.trim()) {
		errors.push('EIN is required')
	} else if (!validateEIN(info.ein)) {
		errors.push('EIN must be in format XX-XXXXXXX')
	}
	if (!info.contactName?.trim()) {
		errors.push('Contact name is required')
	}
	if (!info.contactEmail?.trim()) {
		errors.push('Contact email is required')
	} else if (!validateEmail(info.contactEmail)) {
		errors.push('Invalid email format')
	}
	if (!info.address?.street?.trim()) {
		errors.push('Registered business address is required')
	}
	if (!info.address?.city?.trim()) {
		errors.push('City is required')
	}
	if (!info.address?.state?.trim()) {
		errors.push('State is required')
	}
	if (!info.address?.zipCode?.trim()) {
		errors.push('ZIP code is required')
	}
	if (!info.address?.country?.trim()) {
		errors.push('Country is required')
	}

	return errors
}

// Leasing guarantee messages
export const LEASING_GUARANTEES = [
	'Your leasing agreement will be financed by Macquarie',
	'The approval process usually takes 1-2 business days',
	"We'll process your order once you've signed their agreement digitally",
	"Applying won't affect your business credit score",
] as const
