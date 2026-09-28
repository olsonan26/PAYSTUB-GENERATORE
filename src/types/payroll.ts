export type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

export type PayType = 'hourly' | 'salary';

export type FederalFilingStatus = 'single' | 'married_filing_jointly' | 'head_of_household';

export type UtahTaxMethod = 'formula' | 'flat_455' | 'flat_465' | 'exempt';

export type PaystubTemplate = 'exact_adp' | 'classic' | 'modern' | 'check_stub' | 'executive';

export interface Company {
  id: string;
  name: string;
  dba?: string;
  ein: string; // Federal EIN
  utahTaxId: string; // Utah State Withholding Account No (e.g., WTH-9876543)
  address: string;
  addressLine2?: string; // e.g. "Eight Tower Bridge"
  city: string;
  state: string; // Default 'UT'
  zip: string;
  phone: string;
  inquiryPhone?: string; // e.g. "(800)260-0852"
  email: string;
  logoUrl?: string;
  watermarkText?: string; // 'VOID', 'SAMPLE', 'CONFIDENTIAL', ''
  sutaRate: number; // Utah State Unemployment Insurance employer rate (default ~1.1%)
}

export interface BankAccountInfo {
  bankName: string;
  routingNumberMasked: string; // e.g. "••••••789"
  accountNumberMasked: string; // e.g. "••••••••4321" or "XXXXXXXX9652"
  accountType: 'Checking' | 'Savings';
}

export interface PayPeriodInput {
  periodNumber: number;
  startDate: string;
  endDate: string;
  payDate: string;
  checkNumber: string;
  adviceNumber?: string;
  batchNumber?: string;
  regularHoursWorked?: number;
  overtimeHoursWorked?: number;
  doubleTimeHoursWorked?: number;
  bonusAmount?: number;
  customGross?: number;
}

export interface DeductionItem {
  id: string;
  name: string;
  amount: number;
  isPreTax: boolean; // Pre-tax exempts from FIT and Utah State Tax
  exemptFromFica?: boolean; // Section 125 and HSA also exempt from FICA
  type: '401k' | 'health_insurance' | 'dental_vision' | 'hsa_fsa' | 'roth_401k' | 'garnishment' | 'other';
}

export interface EarningItem {
  id: string;
  description: string;
  hours?: number;
  rate?: number;
  amount: number;
  isTaxable: boolean;
}

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  ssnMasked: string; // e.g. "•••-••-4589"
  ssnLast4: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string; // Default 'UT'
  zip: string;
  department: string;
  title: string;
  hireDate: string;
  
  // Compensation
  payType: PayType;
  payFrequency: PayFrequency;
  hourlyRate: number;
  defaultHoursPerPeriod: number;
  annualSalary: number;
  
  // Utah & Federal Tax Settings
  federalFilingStatus: FederalFilingStatus;
  taxStatus?: string; // Display status: e.g. "Exempt"
  utahTaxMethod: UtahTaxMethod;
  utahAllowances: number; // Allowances for Utah TC-15 calculation
  additionalUtahWithholding: number; // $ extra UT state tax per period
  additionalFederalWithholding: number; // $ extra FIT per period
  w4Step2Check: boolean; // Multiple jobs / spouse works
  w4Step3DependentsAmount: number; // Child / dependent tax credits (e.g. $2,000 per child)
  w4Step4aOtherIncome: number;
  w4Step4bDeductions: number;
  
  // PTO Balance
  ptoHoursAccrued: number;
  ptoHoursUsed: number;
  ptoHoursRemaining: number;
  sickHoursAccrued: number;
  sickHoursUsed: number;
  sickHoursRemaining: number;
  
  // Direct Deposit
  directDeposit: BankAccountInfo;
  
  // Recurring Deductions
  deductions: DeductionItem[];
  
  // Prior YTD Starting Points (if entered mid-year)
  priorYtdGross?: number;
  priorFit?: number;
  priorUtah?: number;
  priorSS?: number;
  priorMed?: number;
  priorNet?: number;
  priorYtdFit?: number;
  priorYtdUtah?: number;
  priorYtdSocialSecurity?: number;
  priorYtdMedicare?: number;
  priorYtdNet?: number;
}

export interface CalculatedPayroll {
  // Period Details
  payPeriodNumber: number; // e.g. 18
  totalPeriodsInYear: number; // 26 for biweekly, 24 for semimonthly, etc.
  startDate: string;
  endDate: string;
  payDate: string;
  checkNumber: string;
  adviceNumber: string;
  batchNumber: string;
  inquiryPhone: string;
  
  // Earnings
  earnings: EarningItem[];
  grossPay: number;
  totalHoursWorked: number;
  regularHours: number;
  regularRate: number;
  regularPay: number;
  overtimeHours: number;
  premiumRate: number;
  overtimePay: number;
  doubleTimeHours: number;
  doubleTimeRate: number;
  doubleTimePay: number;
  bonusPay: number;
  
  // Deductions
  preTaxDeductions: { name: string; amount: number; ytdAmount: number }[];
  postTaxDeductions: { name: string; amount: number; ytdAmount: number }[];
  totalPreTaxDeductions: number;
  totalPostTaxDeductions: number;
  
  // Taxable Bases
  fedTaxableGross: number;
  utahTaxableGross: number;
  ficaTaxableGross: number;
  
  // Employee Taxes
  federalIncomeTax: number;
  utahStateTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  additionalMedicareTax: number;
  totalEmployeeTaxes: number;
  
  // Net Pay
  netPay: number;
  
  // Utah Tax Specifics (for explanation & transparency)
  utahCalculations: {
    statutoryRate: number; // e.g. 0.0455
    annualizedGross: number;
    initialTaxAnnual: number;
    taxpayerCreditAnnual: number;
    creditPhaseoutAnnual: number;
    netCreditAnnual: number;
    finalTaxAnnual: number;
    periodTaxBeforeExtra: number;
    additionalWithholding: number;
    finalPeriodTax: number;
    methodDescription: string;
  };
  
  // Employer Paid Contributions (for transparency)
  employerSocialSecurity: number;
  employerMedicare: number;
  employerFuta: number; // 0.6%
  employerUtahSuta: number; // Utah state unemployment
  employer401kMatch: number;
  employerHealthInsurance: number;
  totalEmployerContributions: number;
  
  // Year-to-Date (YTD) Summary
  ytdGross: number;
  ytdFedTaxable: number;
  ytdFederalIncomeTax: number;
  ytdUtahStateTax: number;
  ytdSocialSecurityTax: number;
  ytdMedicareTax: number;
  ytdPreTaxDeductions: number;
  ytdPostTaxDeductions: number;
  ytdNetPay: number;
}

export interface EmailDispatchRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  recipientEmail: string;
  payPeriod: string;
  netPay: number;
  sentAt: string;
  status: 'sent' | 'pending' | 'failed' | 'queued';
  trackingNumber: string;
  notes?: string;
}
