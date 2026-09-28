import { Company, Employee, PayPeriodInput } from '../types/payroll';
import { getPayPeriodDetailsForTuesday } from './datePayrollLogic';

export const DEFAULT_COMPANY: Company = {
  id: 'comp_ancient_touch',
  name: 'Ancient Touch Therapy',
  dba: 'Ancient Touch Therapy',
  ein: '3095200',
  utahTaxId: '15056820-002-WTH',
  address: '1543 N Redwood Rd',
  city: 'Saratoga Springs',
  state: 'UT',
  zip: '84005',
  phone: '(385) 576-8810',
  inquiryPhone: '(385) 576-8810',
  email: 'ancienttouchtherapy@gmail.com',
  watermarkText: '',
  sutaRate: 0.011, // 1.1% Utah SUI
};

// Initial default pay date: Tuesday 09/22/2026
const initialDateDetails = getPayPeriodDetailsForTuesday('2026-09-22');

export const DEFAULT_PAY_PERIOD: PayPeriodInput = {
  periodNumber: initialDateDetails.periodNumber, // 38
  startDate: initialDateDetails.startDate, // 2026-09-14
  endDate: initialDateDetails.endDate, // 2026-09-20
  payDate: initialDateDetails.payDate, // 2026-09-22
  checkNumber: initialDateDetails.checkNumber, // 129114518
  adviceNumber: initialDateDetails.checkNumber,
  batchNumber: '136266',
  regularHoursWorked: 40,
  overtimeHoursWorked: 0,
  doubleTimeHoursWorked: 0,
  bonusAmount: 0,
};

export const DEFAULT_EMPLOYEE_NADIA: Employee = {
  id: 'emp_nadia_olson',
  employeeNumber: '10054925',
  firstName: 'Nadia',
  lastName: 'Olson',
  ssnMasked: '•••-••-9652',
  ssnLast4: '9652',
  email: 'nadia.olson@ancienttouchtherapy.com',
  phone: '(801) 555-4819',
  address: '4605 E Rustic Ranch Way',
  city: 'Eagle Mountain',
  state: 'UT',
  zip: '84005-6397',
  department: 'Therapy Services',
  title: 'Lead Therapist',
  hireDate: '2024-01-01',
  payType: 'salary',
  payFrequency: 'weekly',
  hourlyRate: 36.058,
  defaultHoursPerPeriod: 40,
  annualSalary: 75000,
  federalFilingStatus: 'married_filing_jointly',
  taxStatus: 'Exempt',
  utahTaxMethod: 'formula', // 2026 Utah Pub 14 Schedule 1 Weekly Married
  utahAllowances: 0,
  additionalUtahWithholding: 0,
  additionalFederalWithholding: 0,
  w4Step2Check: false,
  w4Step3DependentsAmount: 0,
  w4Step4aOtherIncome: 0,
  w4Step4bDeductions: 0,
  ptoHoursAccrued: 40,
  ptoHoursUsed: 0,
  ptoHoursRemaining: 40,
  sickHoursAccrued: 24,
  sickHoursUsed: 0,
  sickHoursRemaining: 24,
  directDeposit: {
    bankName: 'Direct Deposit',
    routingNumberMasked: '••••••085',
    accountNumberMasked: 'XXXXXXX9652',
    accountType: 'Checking',
  },
  deductions: [],
};

export const DEFAULT_EMPLOYEES: Employee[] = [
  DEFAULT_EMPLOYEE_NADIA,
];
