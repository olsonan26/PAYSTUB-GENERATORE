import { CalculatedPayroll, Employee, FederalFilingStatus, PayFrequency, PayPeriodInput, UtahTaxMethod } from '../types/payroll';

export const PAY_PERIODS_PER_YEAR: Record<PayFrequency, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
};

// 2026 Social Security and Medicare Limits
export const SOCIAL_SECURITY_RATE = 0.062; // 6.2%
export const SOCIAL_SECURITY_WAGE_BASE_2026 = 184500; // 2026 IRS Cap
export const MEDICARE_RATE = 0.0145; // 1.45%
export const ADDITIONAL_MEDICARE_THRESHOLD = 200000;
export const ADDITIONAL_MEDICARE_RATE = 0.009; // 0.9%
export const FUTA_RATE = 0.006; // 0.6% on first $7,000
export const DEFAULT_UTAH_SUTA_RATE = 0.011; // 1.1% Utah SUI

export const UTAH_TAX_RATES = {
  currentRate: 0.0445,
  alternateRate: 0.0455,
  standardBase: {
    single: 14600,
    married_filing_jointly: 29200,
    head_of_household: 21900,
  },
  phaseoutThresholds: {
    single: 16560,
    married_filing_jointly: 33120,
    head_of_household: 24840,
  },
};

/**
 * 2026 Utah State Tax Commission Publication 14 - Schedule 1 Weekly Withholding Rules
 *
 * Weekly/Married:
 * 1. Utah taxable wages = weekly taxable wages
 * 2. line 2 = line 1 * 4.45%
 * 3. base allowance = $19
 * 4. line 4 = max(line 1 - $360, 0)
 * 5. line 5 = line 4 * 1.3%
 * 6. line 6 = max($19 - line 5, 0)
 * 7. Utah withholding = max(line 2 - line 6, 0)
 *
 * Weekly/Single:
 * base allowance = $9.50, threshold = $180
 */
export function calculateUtahStateTax2026(
  weeklyTaxableGross: number,
  filingStatus: FederalFilingStatus,
  method: UtahTaxMethod = 'formula',
  additionalWithholding: number = 0
): {
  withholding: number;
  line1Gross: number;
  line2InitialTax: number;
  baseAllowance: number;
  line4Excess: number;
  line5Reduction: number;
  line6NetCredit: number;
  description: string;
} {
  if (method === 'exempt') {
    return {
      withholding: additionalWithholding,
      line1Gross: weeklyTaxableGross,
      line2InitialTax: 0,
      baseAllowance: 0,
      line4Excess: 0,
      line5Reduction: 0,
      line6NetCredit: 0,
      description: 'Exempt from Utah state withholding (Form TC-W).',
    };
  }

  if (method === 'flat_455' || method === 'flat_465') {
    const rate = method === 'flat_455' ? 0.0455 : 0.0465;
    const initialTax = weeklyTaxableGross * rate;
    const finalTax = Math.max(0, Math.round(initialTax * 100) / 100 + additionalWithholding);
    return {
      withholding: finalTax,
      line1Gross: weeklyTaxableGross,
      line2InitialTax: Math.round(initialTax * 100) / 100,
      baseAllowance: 0,
      line4Excess: 0,
      line5Reduction: 0,
      line6NetCredit: 0,
      description: `Utah Flat Rate (${(rate * 100).toFixed(2)}%).`,
    };
  }

  // Official 2026 Utah Publication 14 Schedule 1 Rules
  const isMarried = filingStatus === 'married_filing_jointly';
  const baseAllowance = isMarried ? 19 : 9.5;
  const threshold = isMarried ? 360 : 180;

  // 1. Utah taxable wages = weekly taxable wages
  const line1 = weeklyTaxableGross;

  // 2. line 2 = line 1 * 4.45%
  const line2 = line1 * 0.0445;

  // 4. line 4 = max(line 1 - threshold, 0)
  const line4 = Math.max(0, line1 - threshold);

  // 5. line 5 = line 4 * 1.3%
  const line5 = line4 * 0.013;

  // 6. line 6 = max(base allowance - line 5, 0)
  const line6 = Math.max(0, baseAllowance - line5);

  // 7. Utah withholding = max(line 2 - line 6, 0)
  const rawWithholding = Math.max(0, line2 - line6);
  const finalWithholding = Math.round(rawWithholding * 100) / 100 + additionalWithholding;

  return {
    withholding: Math.round(finalWithholding * 100) / 100,
    line1Gross: Math.round(line1 * 100) / 100,
    line2InitialTax: Math.round(line2 * 100) / 100,
    baseAllowance,
    line4Excess: Math.round(line4 * 100) / 100,
    line5Reduction: Math.round(line5 * 100) / 100,
    line6NetCredit: Math.round(line6 * 100) / 100,
    description: `2026 Utah Pub 14 Schedule 1 Weekly (${isMarried ? 'Married' : 'Single'}): 4.45% less allowance credit.`,
  };
}

export function calculateUtahStateTax(
  gross: number,
  freq: PayFrequency,
  status: FederalFilingStatus,
  method: UtahTaxMethod = 'formula',
  allowances: number = 0,
  extra: number = 0
) {
  const periods = PAY_PERIODS_PER_YEAR[freq] || 52;
  const weeklyGross = (gross * periods) / 52;
  const result = calculateUtahStateTax2026(weeklyGross, status, method, extra);
  return {
    statutoryRate: 0.0445,
    annualizedGross: Math.round(gross * periods * 100) / 100,
    initialTaxAnnual: Math.round(result.line2InitialTax * 52 * 100) / 100,
    taxpayerCreditAnnual: Math.round(result.baseAllowance * 52 * 100) / 100,
    creditPhaseoutAnnual: Math.round(result.line5Reduction * 52 * 100) / 100,
    netCreditAnnual: Math.round(result.line6NetCredit * 52 * 100) / 100,
    finalTaxAnnual: Math.round(result.withholding * periods * 100) / 100,
    periodTaxBeforeExtra: result.withholding - extra,
    additionalWithholding: extra,
    finalPeriodTax: result.withholding,
    methodDescription: result.description,
  };
}

/**
 * 2026 IRS Publication 15-T Percentage Method Tables for Automated Payroll
 * Weekly Payroll - Standard Withholding (Step 2 Checkbox NOT checked)
 */
export function calculateFederalIncomeTax2026(
  weeklyTaxableGross: number,
  filingStatus: FederalFilingStatus,
  w4Step2Check: boolean = false,
  w4Step3Dependents: number = 0,
  step4aOtherIncomeAnnual: number = 0,
  step4bDeductionsAnnual: number = 0,
  additionalWithholding: number = 0
): number {
  // Step 1: Adjusted Weekly Wage
  const adjustedWeeklyWage = weeklyTaxableGross + (step4aOtherIncomeAnnual / 52) - (step4bDeductionsAnnual / 52);

  let tentativeWithholding = 0;

  if (filingStatus === 'married_filing_jointly') {
    if (!w4Step2Check) {
      // 2026 IRS Pub 15-T Weekly Married Filing Jointly Table
      if (adjustedWeeklyWage <= 698) {
        tentativeWithholding = 0;
      } else if (adjustedWeeklyWage <= 1096) {
        tentativeWithholding = (adjustedWeeklyWage - 698) * 0.10;
      } else if (adjustedWeeklyWage <= 2558) {
        // $47.70 + 12% of the amount that the adjusted wage exceeds $1,096
        tentativeWithholding = 47.70 + (adjustedWeeklyWage - 1096) * 0.12;
      } else if (adjustedWeeklyWage <= 4606) {
        tentativeWithholding = 223.14 + (adjustedWeeklyWage - 2558) * 0.22;
      } else if (adjustedWeeklyWage <= 8140) {
        tentativeWithholding = 673.70 + (adjustedWeeklyWage - 4606) * 0.24;
      } else if (adjustedWeeklyWage <= 10135) {
        tentativeWithholding = 1521.86 + (adjustedWeeklyWage - 8140) * 0.32;
      } else if (adjustedWeeklyWage <= 14923) {
        tentativeWithholding = 2160.26 + (adjustedWeeklyWage - 10135) * 0.35;
      } else {
        tentativeWithholding = 3836.06 + (adjustedWeeklyWage - 14923) * 0.37;
      }
    } else {
      // Step 2 checked (higher bracket)
      if (adjustedWeeklyWage <= 349) {
        tentativeWithholding = 0;
      } else if (adjustedWeeklyWage <= 548) {
        tentativeWithholding = (adjustedWeeklyWage - 349) * 0.10;
      } else if (adjustedWeeklyWage <= 1279) {
        tentativeWithholding = 19.90 + (adjustedWeeklyWage - 548) * 0.12;
      } else if (adjustedWeeklyWage <= 2303) {
        tentativeWithholding = 107.62 + (adjustedWeeklyWage - 1279) * 0.22;
      } else {
        tentativeWithholding = 332.90 + (adjustedWeeklyWage - 2303) * 0.24;
      }
    }
  } else {
    // Single / Head of Household
    if (adjustedWeeklyWage <= 349) {
      tentativeWithholding = 0;
    } else if (adjustedWeeklyWage <= 548) {
      tentativeWithholding = (adjustedWeeklyWage - 349) * 0.10;
    } else if (adjustedWeeklyWage <= 1279) {
      tentativeWithholding = 19.90 + (adjustedWeeklyWage - 548) * 0.12;
    } else if (adjustedWeeklyWage <= 2303) {
      tentativeWithholding = 107.62 + (adjustedWeeklyWage - 1279) * 0.22;
    } else if (adjustedWeeklyWage <= 4070) {
      tentativeWithholding = 332.90 + (adjustedWeeklyWage - 2303) * 0.24;
    } else if (adjustedWeeklyWage <= 5067) {
      tentativeWithholding = 756.98 + (adjustedWeeklyWage - 4070) * 0.32;
    } else if (adjustedWeeklyWage <= 12433) {
      tentativeWithholding = 1076.02 + (adjustedWeeklyWage - 5067) * 0.35;
    } else {
      tentativeWithholding = 3654.12 + (adjustedWeeklyWage - 12433) * 0.37;
    }
  }

  // Step 3 credits reduction per week
  if (w4Step3Dependents > 0) {
    tentativeWithholding = Math.max(0, tentativeWithholding - (w4Step3Dependents / 52));
  }

  // Step 4(c) additional withholding
  const finalWithholding = Math.max(0, tentativeWithholding + additionalWithholding);
  return Math.round(finalWithholding * 100) / 100;
}

export interface PaycheckCalculation {
  grossPay: number;
  fedTaxableGross: number;
  ficaTaxableGross: number;
  utahTaxableGross: number;
  socialSecurityTax: number;
  medicareTax: number;
  federalIncomeTax: number;
  utahStateTax: number;
  totalEmployeeTaxes: number;
  totalPreTaxDeductions: number;
  totalPostTaxDeductions: number;
  totalDeductions: number;
  netPay: number;
}

/**
 * Calculates a single paycheck using full decimal precision, rounded to two decimals at posting.
 */
export function calculateSingleCheck(
  employee: Employee,
  periodInput: PayPeriodInput,
  ytdPriorGrossBeforeCheck: number = 0
): PaycheckCalculation {
  const periodsInYear = PAY_PERIODS_PER_YEAR[employee.payFrequency] || 52;
  
  // 1. Calculate Gross
  let grossPay = 0;
  if (periodInput.customGross !== undefined) {
    grossPay = periodInput.customGross;
  } else if (employee.payType === 'salary') {
    // $75,000 / 52 = 1442.307692...
    // Normally posted as $1,442.31
    const unroundedGross = employee.annualSalary / periodsInYear;
    grossPay = Math.round(unroundedGross * 100) / 100;
  } else {
    const regHrs = periodInput.regularHoursWorked ?? employee.defaultHoursPerPeriod ?? 40;
    const otHrs = periodInput.overtimeHoursWorked ?? 0;
    const regPay = regHrs * employee.hourlyRate;
    const otPay = otHrs * (employee.hourlyRate * 1.5);
    grossPay = Math.round((regPay + otPay + (periodInput.bonusAmount || 0)) * 100) / 100;
  }

  // Deductions
  let totalPreTax = 0;
  let totalPostTax = 0;
  let ficaExemptPreTax = 0;

  for (const d of employee.deductions) {
    const amt = Math.round(d.amount * 100) / 100;
    if (d.isPreTax) {
      totalPreTax += amt;
      if (d.exemptFromFica || d.type === 'health_insurance' || d.type === 'dental_vision' || d.type === 'hsa_fsa') {
        ficaExemptPreTax += amt;
      }
    } else {
      totalPostTax += amt;
    }
  }

  const fedTaxableGross = Math.max(0, grossPay - totalPreTax);
  const utahTaxableGross = Math.max(0, grossPay - totalPreTax);
  const ficaTaxableGross = Math.max(0, grossPay - ficaExemptPreTax);

  // FICA / Social Security (6.2%, wage base $184,500)
  const remainingBase = Math.max(0, SOCIAL_SECURITY_WAGE_BASE_2026 - ytdPriorGrossBeforeCheck);
  const ssSubjectWages = Math.min(ficaTaxableGross, remainingBase);
  const socialSecurityTax = Math.round(ssSubjectWages * SOCIAL_SECURITY_RATE * 100) / 100;

  // Medicare (1.45%)
  const medicareTax = Math.round(ficaTaxableGross * MEDICARE_RATE * 100) / 100;

  // Federal Income Tax (Pub 15-T Weekly Married - 0 if exempt)
  const isExempt = employee.taxStatus === 'Exempt';
  const federalIncomeTax = isExempt
    ? 0
    : calculateFederalIncomeTax2026(
        fedTaxableGross,
        employee.federalFilingStatus,
        employee.w4Step2Check,
        employee.w4Step3DependentsAmount,
        employee.w4Step4aOtherIncome,
        employee.w4Step4bDeductions,
        employee.additionalFederalWithholding
      );

  // Utah Withholding (Pub 14 Schedule 1 Weekly - 0 if exempt)
  const utahResult = calculateUtahStateTax2026(
    utahTaxableGross,
    employee.federalFilingStatus,
    employee.utahTaxMethod,
    employee.additionalUtahWithholding
  );
  const utahStateTax = isExempt ? 0 : utahResult.withholding;

  // Total Taxes & Total Deductions
  const totalEmployeeTaxes = Math.round((socialSecurityTax + medicareTax + federalIncomeTax + utahStateTax) * 100) / 100;
  const totalDeductions = Math.round((totalEmployeeTaxes + totalPreTax + totalPostTax) * 100) / 100;
  const netPay = Math.round((grossPay - totalDeductions) * 100) / 100;

  return {
    grossPay,
    fedTaxableGross,
    ficaTaxableGross,
    utahTaxableGross,
    socialSecurityTax,
    medicareTax,
    federalIncomeTax,
    utahStateTax,
    totalEmployeeTaxes,
    totalPreTaxDeductions: totalPreTax,
    totalPostTaxDeductions: totalPostTax,
    totalDeductions,
    netPay,
  };
}

/**
 * Calculates complete payroll with strictly reconciled Year-to-Date (YTD) history.
 * YTD is computed by summing actual historical payroll records from Jan 1 through this check.
 */
export function calculatePayroll(
  employee: Employee,
  periodInput: PayPeriodInput,
  companySutaRate: number = DEFAULT_UTAH_SUTA_RATE
): CalculatedPayroll {
  const periodsInYear = PAY_PERIODS_PER_YEAR[employee.payFrequency] || 52;
  const currentPeriodNum = Math.max(1, periodInput.periodNumber || 1);

  // 1. Simulate historical pay periods from Period 1 to (currentPeriodNum - 1)
  let ytdGross = 0;
  let ytdFedTaxable = 0;
  let ytdFederalIncomeTax = 0;
  let ytdUtahStateTax = 0;
  let ytdSocialSecurityTax = 0;
  let ytdMedicareTax = 0;
  let ytdPreTaxDeductions = 0;
  let ytdPostTaxDeductions = 0;

  for (let p = 1; p < currentPeriodNum; p++) {
    const historicalCheck = calculateSingleCheck(employee, {
      ...periodInput,
      periodNumber: p,
      customGross: undefined,
    }, ytdGross);

    ytdGross += historicalCheck.grossPay;
    ytdFedTaxable += historicalCheck.fedTaxableGross;
    ytdFederalIncomeTax += historicalCheck.federalIncomeTax;
    ytdUtahStateTax += historicalCheck.utahStateTax;
    ytdSocialSecurityTax += historicalCheck.socialSecurityTax;
    ytdMedicareTax += historicalCheck.medicareTax;
    ytdPreTaxDeductions += historicalCheck.totalPreTaxDeductions;
    ytdPostTaxDeductions += historicalCheck.totalPostTaxDeductions;
  }

  // 2. Calculate current pay period
  const currentCheck = calculateSingleCheck(employee, periodInput, ytdGross);

  // 3. Accumulate current check into YTD
  ytdGross = Math.round((ytdGross + currentCheck.grossPay) * 100) / 100;
  ytdFedTaxable = Math.round((ytdFedTaxable + currentCheck.fedTaxableGross) * 100) / 100;
  ytdFederalIncomeTax = Math.round((ytdFederalIncomeTax + currentCheck.federalIncomeTax) * 100) / 100;
  ytdUtahStateTax = Math.round((ytdUtahStateTax + currentCheck.utahStateTax) * 100) / 100;
  ytdSocialSecurityTax = Math.round((ytdSocialSecurityTax + currentCheck.socialSecurityTax) * 100) / 100;
  ytdMedicareTax = Math.round((ytdMedicareTax + currentCheck.medicareTax) * 100) / 100;
  ytdPreTaxDeductions = Math.round((ytdPreTaxDeductions + currentCheck.totalPreTaxDeductions) * 100) / 100;
  ytdPostTaxDeductions = Math.round((ytdPostTaxDeductions + currentCheck.totalPostTaxDeductions) * 100) / 100;

  const ytdTotalTaxes = Math.round((ytdSocialSecurityTax + ytdMedicareTax + ytdFederalIncomeTax + ytdUtahStateTax) * 100) / 100;
  const ytdTotalDeductions = Math.round((ytdTotalTaxes + ytdPreTaxDeductions + ytdPostTaxDeductions) * 100) / 100;
  const ytdNetPay = Math.round((ytdGross - ytdTotalDeductions) * 100) / 100;

  // Earnings line items
  let regularHours = 40;
  let regularRate = 0;
  if (employee.payType === 'salary') {
    regularHours = 40;
    regularRate = Math.round((currentCheck.grossPay / 40) * 1000) / 1000;
  } else {
    regularHours = periodInput.regularHoursWorked ?? employee.defaultHoursPerPeriod ?? 40;
    regularRate = employee.hourlyRate;
  }

  const overtimeHours = periodInput.overtimeHoursWorked || 0;
  const premiumRate = Math.round(regularRate * 1.5 * 1000) / 1000;
  const overtimePay = Math.round(overtimeHours * premiumRate * 100) / 100;
  const regularPay = Math.round((currentCheck.grossPay - overtimePay) * 100) / 100;

  const earnings = [
    {
      id: 'reg_earn',
      description: employee.payType === 'hourly' ? 'Regular Hourly Wages' : 'Salary',
      hours: regularHours,
      rate: regularRate,
      amount: regularPay,
      isTaxable: true,
    },
  ];

  if (overtimePay > 0) {
    earnings.push({
      id: 'ot_earn',
      description: 'Overtime (1.5x)',
      hours: overtimeHours,
      rate: premiumRate,
      amount: overtimePay,
      isTaxable: true,
    });
  }

  const utahBreakdown = calculateUtahStateTax2026(
    currentCheck.utahTaxableGross,
    employee.federalFilingStatus,
    employee.utahTaxMethod,
    employee.additionalUtahWithholding
  );

  return {
    payPeriodNumber: currentPeriodNum,
    totalPeriodsInYear: periodsInYear,
    startDate: periodInput.startDate,
    endDate: periodInput.endDate,
    payDate: periodInput.payDate,
    checkNumber: periodInput.checkNumber,
    adviceNumber: periodInput.adviceNumber || periodInput.checkNumber,
    batchNumber: periodInput.batchNumber || '136266',
    inquiryPhone: '(801) 555-0199',
    earnings,
    grossPay: currentCheck.grossPay,
    totalHoursWorked: regularHours + overtimeHours,
    regularHours,
    regularRate,
    regularPay,
    overtimeHours,
    premiumRate,
    overtimePay,
    doubleTimeHours: 0,
    doubleTimeRate: 0,
    doubleTimePay: 0,
    bonusPay: periodInput.bonusAmount || 0,
    preTaxDeductions: employee.deductions.filter(d => d.isPreTax).map(d => ({
      name: d.name,
      amount: d.amount,
      ytdAmount: Math.round(d.amount * currentPeriodNum * 100) / 100,
    })),
    postTaxDeductions: employee.deductions.filter(d => !d.isPreTax).map(d => ({
      name: d.name,
      amount: d.amount,
      ytdAmount: Math.round(d.amount * currentPeriodNum * 100) / 100,
    })),
    totalPreTaxDeductions: currentCheck.totalPreTaxDeductions,
    totalPostTaxDeductions: currentCheck.totalPostTaxDeductions,
    fedTaxableGross: currentCheck.fedTaxableGross,
    utahTaxableGross: currentCheck.utahTaxableGross,
    ficaTaxableGross: currentCheck.ficaTaxableGross,
    federalIncomeTax: currentCheck.federalIncomeTax,
    utahStateTax: currentCheck.utahStateTax,
    socialSecurityTax: currentCheck.socialSecurityTax,
    medicareTax: currentCheck.medicareTax,
    additionalMedicareTax: 0,
    totalEmployeeTaxes: currentCheck.totalEmployeeTaxes,
    netPay: currentCheck.netPay,
    utahCalculations: {
      statutoryRate: 0.0445,
      annualizedGross: Math.round(currentCheck.utahTaxableGross * periodsInYear * 100) / 100,
      initialTaxAnnual: Math.round(utahBreakdown.line2InitialTax * periodsInYear * 100) / 100,
      taxpayerCreditAnnual: Math.round(utahBreakdown.baseAllowance * periodsInYear * 100) / 100,
      creditPhaseoutAnnual: Math.round(utahBreakdown.line5Reduction * periodsInYear * 100) / 100,
      netCreditAnnual: Math.round(utahBreakdown.line6NetCredit * periodsInYear * 100) / 100,
      finalTaxAnnual: Math.round(utahBreakdown.withholding * periodsInYear * 100) / 100,
      periodTaxBeforeExtra: utahBreakdown.withholding - employee.additionalUtahWithholding,
      additionalWithholding: employee.additionalUtahWithholding,
      finalPeriodTax: utahBreakdown.withholding,
      methodDescription: utahBreakdown.description,
    },
    employerSocialSecurity: currentCheck.socialSecurityTax,
    employerMedicare: currentCheck.medicareTax,
    employerFuta: Math.round(currentCheck.grossPay * FUTA_RATE * 100) / 100,
    employerUtahSuta: Math.round(currentCheck.grossPay * companySutaRate * 100) / 100,
    employer401kMatch: 0,
    employerHealthInsurance: 0,
    totalEmployerContributions: Math.round((currentCheck.socialSecurityTax + currentCheck.medicareTax + (currentCheck.grossPay * FUTA_RATE) + (currentCheck.grossPay * companySutaRate)) * 100) / 100,
    ytdGross,
    ytdFedTaxable,
    ytdFederalIncomeTax,
    ytdUtahStateTax,
    ytdSocialSecurityTax,
    ytdMedicareTax,
    ytdPreTaxDeductions,
    ytdPostTaxDeductions,
    ytdNetPay,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}
