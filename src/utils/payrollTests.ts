import { DEFAULT_COMPANY, DEFAULT_EMPLOYEE_NADIA } from './defaultData';
import { getPayPeriodDetailsForTuesday } from './datePayrollLogic';
import { calculatePayroll } from './taxCalculator';

export interface TestResult {
  date: string;
  periodNumber: number;
  startDate: string;
  endDate: string;
  grossPay: number;
  expectedGross: number;
  fica: number;
  expectedFica: number;
  medicare: number;
  expectedMedicare: number;
  federalTax: number;
  expectedFederalTax: number;
  utahTax: number;
  expectedUtahTax: number;
  currentDeductions: number;
  expectedCurrentDeductions: number;
  netPay: number;
  expectedNetPay: number;
  ytdGross: number;
  expectedYtdGross: number;
  ytdFica: number;
  expectedYtdFica: number;
  ytdMedicare: number;
  expectedYtdMedicare: number;
  ytdFederalTax: number;
  expectedYtdFederalTax: number;
  ytdUtahTax: number;
  expectedYtdUtahTax: number;
  ytdNetPay: number;
  expectedYtdNetPay: number;
  checkNumber: string;
  passed: boolean;
  reconciledToCent: boolean;
}

export function runDeterministicPayrollTests(): {
  allPassed: boolean;
  results: TestResult[];
} {
  const testDates = [
    { date: '2026-09-01', period: 35, start: '2026-08-24', end: '2026-08-30' },
    { date: '2026-09-08', period: 36, start: '2026-08-31', end: '2026-09-06' },
    { date: '2026-09-15', period: 37, start: '2026-09-07', end: '2026-09-13' },
    { date: '2026-09-22', period: 38, start: '2026-09-14', end: '2026-09-20' },
  ];

  const results: TestResult[] = testDates.map((item) => {
    const periodInfo = getPayPeriodDetailsForTuesday(item.date);
    const payroll = calculatePayroll(DEFAULT_EMPLOYEE_NADIA, {
      periodNumber: periodInfo.periodNumber,
      startDate: periodInfo.startDate,
      endDate: periodInfo.endDate,
      payDate: periodInfo.payDate,
      checkNumber: periodInfo.checkNumber,
      adviceNumber: periodInfo.checkNumber,
      batchNumber: '136266',
    }, DEFAULT_COMPANY.sutaRate);

    const N = item.period;
    const expGross = 1442.31;
    const expFica = 89.42;
    const expMed = 20.91;
    const expFed = 89.26;
    const expUtah = 59.25;
    const expCurrentDed = Math.round((expFica + expMed + expFed + expUtah) * 100) / 100; // 258.84
    const expNet = Math.round((expGross - expCurrentDed) * 100) / 100; // 1183.47

    const expYtdGross = Math.round(expGross * N * 100) / 100;
    const expYtdFica = Math.round(expFica * N * 100) / 100;
    const expYtdMed = Math.round(expMed * N * 100) / 100;
    const expYtdFed = Math.round(expFed * N * 100) / 100;
    const expYtdUtah = Math.round(expUtah * N * 100) / 100;
    const expYtdDed = Math.round((expYtdFica + expYtdMed + expYtdFed + expYtdUtah) * 100) / 100;
    const expYtdNet = Math.round((expYtdGross - expYtdDed) * 100) / 100;

    const currentMatches =
      payroll.grossPay === expGross &&
      payroll.socialSecurityTax === expFica &&
      payroll.medicareTax === expMed &&
      payroll.federalIncomeTax === expFed &&
      payroll.utahStateTax === expUtah &&
      payroll.netPay === expNet;

    const ytdMatches =
      payroll.ytdGross === expYtdGross &&
      payroll.ytdSocialSecurityTax === expYtdFica &&
      payroll.ytdMedicareTax === expYtdMed &&
      payroll.ytdFederalIncomeTax === expYtdFed &&
      payroll.ytdUtahStateTax === expYtdUtah &&
      payroll.ytdNetPay === expYtdNet;

    const datesMatch =
      periodInfo.startDate === item.start &&
      periodInfo.endDate === item.end &&
      periodInfo.periodNumber === item.period;

    const reconciledToCent =
      Math.abs(payroll.netPay - (payroll.grossPay - (payroll.socialSecurityTax + payroll.medicareTax + payroll.federalIncomeTax + payroll.utahStateTax))) < 0.001 &&
      Math.abs(payroll.ytdNetPay - (payroll.ytdGross - (payroll.ytdSocialSecurityTax + payroll.ytdMedicareTax + payroll.ytdFederalIncomeTax + payroll.ytdUtahStateTax))) < 0.001;

    return {
      date: item.date,
      periodNumber: periodInfo.periodNumber,
      startDate: periodInfo.startDate,
      endDate: periodInfo.endDate,
      grossPay: payroll.grossPay,
      expectedGross: expGross,
      fica: payroll.socialSecurityTax,
      expectedFica: expFica,
      medicare: payroll.medicareTax,
      expectedMedicare: expMed,
      federalTax: payroll.federalIncomeTax,
      expectedFederalTax: expFed,
      utahTax: payroll.utahStateTax,
      expectedUtahTax: expUtah,
      currentDeductions: Math.round((payroll.socialSecurityTax + payroll.medicareTax + payroll.federalIncomeTax + payroll.utahStateTax) * 100) / 100,
      expectedCurrentDeductions: expCurrentDed,
      netPay: payroll.netPay,
      expectedNetPay: expNet,
      ytdGross: payroll.ytdGross,
      expectedYtdGross: expYtdGross,
      ytdFica: payroll.ytdSocialSecurityTax,
      expectedYtdFica: expYtdFica,
      ytdMedicare: payroll.ytdMedicareTax,
      expectedYtdMedicare: expYtdMed,
      ytdFederalTax: payroll.ytdFederalIncomeTax,
      expectedYtdFederalTax: expYtdFed,
      ytdUtahTax: payroll.ytdUtahStateTax,
      expectedYtdUtahTax: expYtdUtah,
      ytdNetPay: payroll.ytdNetPay,
      expectedYtdNetPay: expYtdNet,
      checkNumber: periodInfo.checkNumber,
      passed: currentMatches && ytdMatches && datesMatch && reconciledToCent,
      reconciledToCent,
    };
  });

  const allPassed = results.every((r) => r.passed);
  return { allPassed, results };
}
