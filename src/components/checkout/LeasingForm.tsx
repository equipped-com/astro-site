import { CheckCircle2, Info, Loader2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { BankVerification } from './BankVerification'
import { CompanyInfoForm } from './CompanyInfoForm'
import type {
	BankStatement,
	BankVerificationMethod,
	CompanyInfo,
	LeaseApplication,
	LeaseTerm,
	LeasingFormProps,
	PlaidLinkResult,
} from './types'
import {
	calculateBuyoutAmount,
	calculateMonthlyPayment,
	formatCurrency,
	LEASING_GUARANTEES,
	validateCompanyInfo,
} from './types'

export function LeasingForm({ cartTotal, leaseTerm, onLeaseTermChange, onSubmit, disabled = false }: LeasingFormProps) {
	// Company info state
	const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
	const [companyInfoValid, setCompanyInfoValid] = useState(false)

	// Bank verification state
	const [bankVerificationMethod, setBankVerificationMethod] = useState<BankVerificationMethod>('plaid')
	const [plaidResult, setPlaidResult] = useState<PlaidLinkResult | undefined>()
	const [bankStatements, setBankStatements] = useState<BankStatement[]>([])

	// Form state
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [submitError, setSubmitError] = useState<string | null>(null)

	// Calculate lease terms
	const monthlyPayment = useMemo(() => calculateMonthlyPayment(cartTotal, leaseTerm), [cartTotal, leaseTerm])

	const buyoutAmount = useMemo(() => calculateBuyoutAmount(cartTotal, leaseTerm), [cartTotal, leaseTerm])

	// Validate form completeness
	const isBankVerificationComplete = useMemo(() => {
		if (bankVerificationMethod === 'plaid') {
			return plaidResult?.verified === true
		}
		return bankStatements.length >= 3
	}, [bankVerificationMethod, plaidResult, bankStatements])

	const canSubmit = companyInfoValid && isBankVerificationComplete && !isSubmitting && !disabled

	// Handlers
	const handleCompanyInfoChange = useCallback((data: CompanyInfo, isValid: boolean) => {
		setCompanyInfo(data)
		setCompanyInfoValid(isValid)
		setSubmitError(null)
	}, [])

	const handlePlaidSuccess = useCallback((result: PlaidLinkResult) => {
		setPlaidResult(result)
		setSubmitError(null)
	}, [])

	const handleUploadComplete = useCallback((statements: BankStatement[]) => {
		setBankStatements(statements)
		setSubmitError(null)
	}, [])

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()

			if (!canSubmit || !companyInfo) return

			// Final validation
			const errors = validateCompanyInfo(companyInfo)
			if (errors.length > 0) {
				setSubmitError(errors[0])
				return
			}

			if (!isBankVerificationComplete) {
				setSubmitError(
					bankVerificationMethod === 'plaid'
						? 'Please connect your bank account via Plaid'
						: 'Please upload at least 3 bank statements',
				)
				return
			}

			setIsSubmitting(true)
			setSubmitError(null)

			try {
				const application: LeaseApplication = {
					companyInfo,
					bankVerificationMethod,
					plaidResult: bankVerificationMethod === 'plaid' ? plaidResult : undefined,
					bankStatements: bankVerificationMethod === 'upload' ? bankStatements : undefined,
					leaseTerm,
					equipmentValue: cartTotal,
					monthlyPayment,
					buyoutAmount,
				}

				await onSubmit(application)
			} catch (error) {
				setSubmitError(error instanceof Error ? error.message : 'Failed to submit leasing application')
			} finally {
				setIsSubmitting(false)
			}
		},
		[
			canSubmit,
			companyInfo,
			isBankVerificationComplete,
			bankVerificationMethod,
			plaidResult,
			bankStatements,
			leaseTerm,
			cartTotal,
			monthlyPayment,
			buyoutAmount,
			onSubmit,
		],
	)

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Lease Term Selection */}
			<div>
				<h4 className="text-sm font-medium text-foreground mb-3">Select lease term</h4>
				<div className="grid grid-cols-2 gap-3">
					<LeaseTermOption
						term={24}
						monthlyPayment={calculateMonthlyPayment(cartTotal, 24)}
						buyoutAmount={calculateBuyoutAmount(cartTotal, 24)}
						isSelected={leaseTerm === 24}
						onSelect={() => onLeaseTermChange(24)}
						disabled={disabled || isSubmitting}
					/>
					<LeaseTermOption
						term={36}
						monthlyPayment={calculateMonthlyPayment(cartTotal, 36)}
						buyoutAmount={calculateBuyoutAmount(cartTotal, 36)}
						isSelected={leaseTerm === 36}
						onSelect={() => onLeaseTermChange(36)}
						disabled={disabled || isSubmitting}
					/>
				</div>
			</div>

			{/* Monthly Payment Summary */}
			<div className="rounded-lg border border-accent bg-accent/10 p-4">
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm font-medium text-foreground">Monthly payment</span>
					<span className="text-xl font-bold text-foreground">{formatCurrency(monthlyPayment)}/mo</span>
				</div>
				<p className="text-sm text-muted-foreground">
					Return or buy it out for {formatCurrency(buyoutAmount)} after {leaseTerm} months
				</p>
			</div>

			{/* Leasing Guarantees */}
			<div className="space-y-2">
				{LEASING_GUARANTEES.map((message, index) => (
					<div key={index} className="flex items-start gap-2">
						<CheckCircle2 className="h-4 w-4 text-accent-foreground mt-0.5 flex-shrink-0" />
						<span className="text-sm text-muted-foreground">{message}</span>
					</div>
				))}
			</div>

			{/* Divider */}
			<hr className="border-border" />

			{/* Company Information */}
			<div>
				<h3 className="text-base font-semibold text-foreground mb-4">Company Information</h3>
				<CompanyInfoForm onChange={handleCompanyInfoChange} disabled={disabled || isSubmitting} />
			</div>

			{/* Divider */}
			<hr className="border-border" />

			{/* Bank Verification */}
			<BankVerification
				method={bankVerificationMethod}
				onMethodChange={setBankVerificationMethod}
				onPlaidSuccess={handlePlaidSuccess}
				onUploadComplete={handleUploadComplete}
				plaidResult={plaidResult}
				bankStatements={bankStatements}
				disabled={disabled || isSubmitting}
			/>

			{/* Error Message */}
			{submitError && (
				<div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
					<p className="text-sm text-destructive">{submitError}</p>
				</div>
			)}

			{/* Submit Button */}
			<button
				type="submit"
				disabled={!canSubmit}
				className={cn(
					'w-full flex items-center justify-center gap-2',
					'rounded-md px-4 py-3 text-sm font-medium',
					'bg-primary text-primary-foreground',
					'hover:bg-primary/90',
					'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
					'disabled:opacity-50 disabled:cursor-not-allowed',
					'transition-colors',
				)}
			>
				{isSubmitting ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" />
						Submitting application...
					</>
				) : (
					'Apply & place order'
				)}
			</button>

			{/* Info Note */}
			<div className="flex items-start gap-2 text-xs text-muted-foreground">
				<Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
				<span>
					By clicking "Apply & place order", you agree to submit a leasing application to Macquarie. Your order will be
					processed after approval.
				</span>
			</div>
		</form>
	)
}

// Sub-component for lease term option
interface LeaseTermOptionProps {
	term: LeaseTerm
	monthlyPayment: number
	buyoutAmount: number
	isSelected: boolean
	onSelect: () => void
	disabled: boolean
}

function LeaseTermOption({ term, monthlyPayment, buyoutAmount, isSelected, onSelect, disabled }: LeaseTermOptionProps) {
	return (
		<button
			type="button"
			onClick={onSelect}
			disabled={disabled}
			className={cn(
				'relative rounded-lg border p-4 text-left transition-colors',
				isSelected
					? 'border-primary bg-primary/5 ring-1 ring-primary'
					: 'border-border hover:border-muted-foreground/50',
				'disabled:opacity-50 disabled:cursor-not-allowed',
			)}
		>
			{/* Selection Indicator */}
			<div
				className={cn(
					'absolute top-3 right-3 h-4 w-4 rounded-full border-2 transition-colors',
					isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30',
				)}
			>
				{isSelected && (
					<CheckCircle2 className="h-3 w-3 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
				)}
			</div>

			<div className="pr-6">
				<p className="font-semibold text-foreground">{term}-Month Leasing</p>
				<p className="text-lg font-bold text-primary mt-1">{formatCurrency(monthlyPayment)}/mo</p>
				<p className="text-xs text-muted-foreground mt-1">{formatCurrency(buyoutAmount)} buyout</p>
			</div>
		</button>
	)
}
