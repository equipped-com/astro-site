// Checkout Stage 4: Payment components
// Main entry point for payment/leasing functionality

export { BankStatementUpload } from './BankStatementUpload'
export { BankVerification } from './BankVerification'
export { CardPaymentForm } from './CardPaymentForm'
export { CompanyInfoForm } from './CompanyInfoForm'
export { LeasingForm } from './LeasingForm'
export { PaymentStage } from './PaymentStage'
export { PlaidConnect } from './PlaidConnect'

// Types
export type {
	BankStatement,
	BankStatementUploadProps,
	BankVerificationMethod,
	BankVerificationProps,
	CardPaymentData,
	CardPaymentFormProps,
	CompanyInfo,
	CompanyInfoFormProps,
	LeaseApplication,
	LeaseTerm,
	LeasingFormProps,
	PaymentMethod,
	PaymentStageProps,
	PlaidConnectProps,
	PlaidLinkResult,
} from './types'

// Utility functions
export {
	calculateBuyoutAmount,
	calculateMonthlyPayment,
	formatCurrency,
	LEASING_GUARANTEES,
	validateCompanyInfo,
	validateEIN,
	validateEmail,
} from './types'
