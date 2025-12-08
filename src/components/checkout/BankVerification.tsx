import { Building2, FileText } from 'lucide-react'
import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { BankStatementUpload } from './BankStatementUpload'
import { PlaidConnect } from './PlaidConnect'
import type { BankStatement, BankVerificationMethod, BankVerificationProps } from './types'

export function BankVerification({
	method,
	onMethodChange,
	onPlaidSuccess,
	onUploadComplete,
	plaidResult,
	bankStatements = [],
	disabled = false,
}: BankVerificationProps) {
	const [localStatements, setLocalStatements] = useState<BankStatement[]>(bankStatements)

	const handlePlaidError = useCallback((error: Error) => {
		console.error('Plaid connection error:', error)
		// Could show toast notification here
	}, [])

	const handleUpload = useCallback(
		async (files: File[]) => {
			// In production, this would upload to storage (R2, S3, etc.)
			// and return document references for the lease application
			const newStatements: BankStatement[] = files.map(file => ({
				id: `statement-${Date.now()}-${Math.random().toString(36).slice(2)}`,
				fileName: file.name,
				fileSize: file.size,
				uploadedAt: new Date(),
			}))

			const updatedStatements = [...localStatements, ...newStatements]
			setLocalStatements(updatedStatements)
			onUploadComplete(updatedStatements)
		},
		[localStatements, onUploadComplete],
	)

	const handleRemove = useCallback(
		(id: string) => {
			const updatedStatements = localStatements.filter(s => s.id !== id)
			setLocalStatements(updatedStatements)
			onUploadComplete(updatedStatements)
		},
		[localStatements, onUploadComplete],
	)

	return (
		<div className="space-y-4">
			<div className="border-b border-border pb-4">
				<h4 className="text-sm font-medium text-foreground mb-3">Bank Verification</h4>
				<p className="text-sm text-muted-foreground mb-4">
					We need to verify your business bank account to process your leasing application. Choose your preferred
					method:
				</p>

				{/* Tab buttons */}
				<div className="flex gap-2 p-1 bg-muted rounded-lg">
					<button
						type="button"
						onClick={() => onMethodChange('plaid')}
						disabled={disabled}
						className={cn(
							'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
							method === 'plaid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
							'disabled:opacity-50 disabled:cursor-not-allowed',
						)}
					>
						<Building2 className="h-4 w-4" />
						Connect with Plaid
					</button>
					<button
						type="button"
						onClick={() => onMethodChange('upload')}
						disabled={disabled}
						className={cn(
							'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
							method === 'upload' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
							'disabled:opacity-50 disabled:cursor-not-allowed',
						)}
					>
						<FileText className="h-4 w-4" />
						Upload bank statements
					</button>
				</div>
			</div>

			{/* Content based on selected method */}
			<div className="pt-2">
				{method === 'plaid' ? (
					<PlaidConnect
						onSuccess={onPlaidSuccess}
						onError={handlePlaidError}
						disabled={disabled}
						result={plaidResult}
					/>
				) : (
					<BankStatementUpload
						statements={localStatements}
						onUpload={handleUpload}
						onRemove={handleRemove}
						disabled={disabled}
					/>
				)}
			</div>

			{/* Helper text for alternative method */}
			{method === 'plaid' && !plaidResult?.verified && (
				<p className="text-xs text-muted-foreground">
					Don't have online banking access?{' '}
					<button
						type="button"
						onClick={() => onMethodChange('upload')}
						disabled={disabled}
						className="text-primary hover:underline underline-offset-2 disabled:opacity-50"
					>
						Upload bank statements instead
					</button>
				</p>
			)}

			{method === 'upload' && localStatements.length === 0 && (
				<p className="text-xs text-muted-foreground">
					Want faster verification?{' '}
					<button
						type="button"
						onClick={() => onMethodChange('plaid')}
						disabled={disabled}
						className="text-primary hover:underline underline-offset-2 disabled:opacity-50"
					>
						Connect with Plaid instead
					</button>
				</p>
			)}
		</div>
	)
}
