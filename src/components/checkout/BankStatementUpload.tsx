import { CheckCircle2, FileText, Loader2, Upload, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { BankStatement, BankStatementUploadProps } from './types'

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function BankStatementUpload({ statements, onUpload, onRemove, disabled = false }: BankStatementUploadProps) {
	const [isDragging, setIsDragging] = useState(false)
	const [isUploading, setIsUploading] = useState(false)
	const [uploadError, setUploadError] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleFiles = useCallback(
		async (files: FileList | File[]) => {
			const fileArray = Array.from(files)

			// Validate files
			const invalidFiles = fileArray.filter(file => {
				// Accept PDF and common image formats for bank statements
				const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
				return !validTypes.includes(file.type)
			})

			if (invalidFiles.length > 0) {
				setUploadError('Please upload PDF or image files (JPEG, PNG) for bank statements')
				return
			}

			// Check file size (max 10MB per file)
			const oversizedFiles = fileArray.filter(file => file.size > 10 * 1024 * 1024)
			if (oversizedFiles.length > 0) {
				setUploadError('Files must be smaller than 10MB')
				return
			}

			// Check total count (require at least 3, max 6)
			if (statements.length + fileArray.length > 6) {
				setUploadError('Maximum 6 bank statements allowed')
				return
			}

			setUploadError(null)
			setIsUploading(true)

			try {
				await onUpload(fileArray)
			} catch (error) {
				setUploadError(error instanceof Error ? error.message : 'Failed to upload files')
			} finally {
				setIsUploading(false)
			}
		},
		[statements.length, onUpload],
	)

	const handleDragOver = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			if (!disabled) {
				setIsDragging(true)
			}
		},
		[disabled],
	)

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		setIsDragging(false)
	}, [])

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			setIsDragging(false)

			if (disabled || isUploading) return

			const files = e.dataTransfer.files
			if (files.length > 0) {
				handleFiles(files)
			}
		},
		[disabled, isUploading, handleFiles],
	)

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files
			if (files && files.length > 0) {
				handleFiles(files)
			}
			// Reset input so same file can be selected again
			e.target.value = ''
		},
		[handleFiles],
	)

	const handleBrowseClick = useCallback(() => {
		fileInputRef.current?.click()
	}, [])

	const hasMinimumStatements = statements.length >= 3

	return (
		<div className="space-y-4">
			{/* Upload Zone */}
			<div
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				className={cn(
					'relative rounded-lg border-2 border-dashed p-6 text-center transition-colors',
					isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50',
					disabled && 'opacity-50 cursor-not-allowed',
					uploadError && 'border-destructive',
				)}
			>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					accept=".pdf,.jpg,.jpeg,.png,.webp"
					onChange={handleFileSelect}
					disabled={disabled || isUploading}
					className="sr-only"
					aria-label="Upload bank statements"
				/>

				<div className="flex flex-col items-center">
					{isUploading ? (
						<Loader2 className="h-10 w-10 mb-3 text-primary animate-spin" />
					) : (
						<Upload className="h-10 w-10 mb-3 text-muted-foreground" />
					)}

					<p className="text-sm font-medium text-foreground mb-1">
						{isUploading ? 'Uploading...' : 'Drag and drop here or browse files'}
					</p>

					<p className="text-xs text-muted-foreground mb-3">Upload past 3 months of bank statements (PDF or images)</p>

					<button
						type="button"
						onClick={handleBrowseClick}
						disabled={disabled || isUploading}
						className={cn(
							'rounded-md px-4 py-2 text-sm font-medium',
							'bg-secondary text-secondary-foreground',
							'hover:bg-secondary/80',
							'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
							'disabled:opacity-50 disabled:cursor-not-allowed',
							'transition-colors',
						)}
					>
						Browse files
					</button>
				</div>
			</div>

			{/* Error Message */}
			{uploadError && <p className="text-sm text-destructive">{uploadError}</p>}

			{/* Uploaded Files List */}
			{statements.length > 0 && (
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<p className="text-sm font-medium text-foreground">Uploaded statements ({statements.length}/3 minimum)</p>
						{hasMinimumStatements && (
							<span className="flex items-center gap-1 text-xs text-accent-foreground">
								<CheckCircle2 className="h-3.5 w-3.5" />
								Requirement met
							</span>
						)}
					</div>

					<ul className="space-y-2">
						{statements.map(statement => (
							<li key={statement.id} className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
								<div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
									<FileText className="h-4 w-4 text-muted-foreground" />
								</div>

								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-foreground truncate">{statement.fileName}</p>
									<p className="text-xs text-muted-foreground">{formatFileSize(statement.fileSize)}</p>
								</div>

								<button
									type="button"
									onClick={() => onRemove(statement.id)}
									disabled={disabled}
									className={cn(
										'rounded p-1',
										'text-muted-foreground hover:text-destructive',
										'hover:bg-destructive/10',
										'focus:outline-none focus:ring-2 focus:ring-ring',
										'disabled:opacity-50 disabled:cursor-not-allowed',
										'transition-colors',
									)}
									aria-label={`Remove ${statement.fileName}`}
								>
									<X className="h-4 w-4" />
								</button>
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Minimum requirement hint */}
			{statements.length > 0 && !hasMinimumStatements && (
				<p className="text-sm text-muted-foreground">
					Please upload at least {3 - statements.length} more statement
					{3 - statements.length > 1 ? 's' : ''} to continue
				</p>
			)}
		</div>
	)
}
