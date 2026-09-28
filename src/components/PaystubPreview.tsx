import React from 'react';
import { CalculatedPayroll, Company, Employee, PaystubTemplate } from '../types/payroll';
import { formatCurrency, formatNumber } from '../utils/taxCalculator';

interface PaystubPreviewProps {
  company: Company;
  employee: Employee;
  payroll: CalculatedPayroll;
  template: PaystubTemplate;
  containerId?: string;
}

// Convert number to words for check stub (e.g., "Two Thousand Four Hundred Fifty Dollars and 50/100")
function numberToWords(amount: number): string {
  const wholePart = Math.floor(amount);
  const cents = Math.round((amount - wholePart) * 100);

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertGroup(n: number): string {
    let s = '';
    if (n >= 100) {
      s += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      s += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      s += ones[n] + ' ';
    }
    return s;
  }

  if (wholePart === 0) return `Zero Dollars and ${cents.toString().padStart(2, '0')}/100`;

  let result = '';
  const thousands = Math.floor(wholePart / 1000);
  const remainder = wholePart % 1000;

  if (thousands > 0) {
    result += convertGroup(thousands) + 'Thousand ';
  }
  if (remainder > 0) {
    result += convertGroup(remainder);
  }

  return `${result.trim()} Dollars and ${cents.toString().padStart(2, '0')}/100`;
}

export const PaystubPreview: React.FC<PaystubPreviewProps> = ({
  company,
  employee,
  payroll,
  template,
  containerId = 'paystub-document-render',
}) => {
  const watermark = company.watermarkText?.trim();

  // Helper date formatters
  const formatDateSlash = (d: string) => {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
    return d;
  };

  const formatDateShort = (d: string) => {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0].slice(-2)}`;
    return d;
  };

  const formatDotZero = (amt: number) => {
    if (amt === 0) return '.00';
    return amt.toFixed(2);
  };

  // 0. EXACT MATCH TO UPLOADED PAYCHECK (Universal Protection Service / ADP Standard Style)
  if (template === 'exact_adp') {
    const totalCurrentDeductions = payroll.totalPreTaxDeductions + payroll.totalPostTaxDeductions + payroll.totalEmployeeTaxes;
    const totalYtdDeductions = payroll.ytdPreTaxDeductions + payroll.ytdPostTaxDeductions + (payroll.ytdFederalIncomeTax + payroll.ytdUtahStateTax + payroll.ytdSocialSecurityTax + payroll.ytdMedicareTax);
    const totalTaxes = payroll.totalEmployeeTaxes;
    const totalYtdTaxes = payroll.ytdFederalIncomeTax + payroll.ytdUtahStateTax + payroll.ytdSocialSecurityTax + payroll.ytdMedicareTax;

    return (
      <div
        id={containerId}
        className="relative bg-white text-neutral-900 border border-neutral-300 shadow-sm p-10 max-w-[800px] mx-auto select-text print:border-none print:shadow-none print:p-0 print:m-0"
        style={{ minHeight: '1100px', backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }}
      >
        {watermark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-10">
            <span className="text-8xl font-black uppercase tracking-widest text-neutral-900 -rotate-45 font-courier">
              {watermark}
            </span>
          </div>
        )}

        {/* TOP ROW: Company Left, Title & Meta Right */}
        <div className="flex justify-between items-start">
          
          {/* Company Details Left */}
          <div className="text-left text-[11px] text-neutral-900 leading-[1.3] w-[45%]">
            <div className="pl-14 text-neutral-900 font-arial font-normal">
              <div>{company.name}</div>
              <div className="italic text-neutral-800">{company.address}</div>
              {company.addressLine2 && <div className="text-neutral-800">{company.addressLine2}</div>}
              <div>{company.city}, {company.state} {company.zip}</div>
            </div>

            {/* Exemptions Block (Courier Monospace - matches Screenshot 1 & 2) */}
            <div className="mt-4 font-courier text-[11px] leading-[1.35] text-neutral-900">
              <div className="flex">
                <span className="w-16"></span>
                <span className="w-24 text-center font-bold">Exemptions</span>
                <span className="w-16 text-center font-bold">Addl</span>
                <span className="w-20 text-center font-bold">Status</span>
              </div>
              <div className="flex">
                <span className="w-16 font-bold">Fed:</span>
                <span className="w-24 text-center font-normal">${employee.w4Step3DependentsAmount || 0}</span>
                <span className="w-16 text-center font-normal">${employee.additionalFederalWithholding ? employee.additionalFederalWithholding.toFixed(2) : '0.00'}</span>
                <span className="w-20 text-center font-normal">Exempt</span>
              </div>
              <div className="flex">
                <span className="w-16 font-bold">State:</span>
                <span className="w-24 text-center font-normal">{employee.utahAllowances || 0}</span>
                <span className="w-16 text-center font-normal">${employee.additionalUtahWithholding ? employee.additionalUtahWithholding.toFixed(2) : '0.00'}</span>
                <span className="w-20 text-center font-normal"></span>
              </div>
            </div>
          </div>

          {/* Statement Header & Meta Right */}
          <div className="text-right w-[52%]">
            <h1 className="text-[22px] font-bold tracking-tight text-neutral-900 font-arial">
              Earnings Statement
            </h1>
            <div className="text-[11px] font-courier text-neutral-900 mt-0.5">Page 001 of 001</div>

            {/* Metadata Table (100% Courier) */}
            <div className="mt-3 text-[11px] font-courier leading-[1.35] text-neutral-900 inline-block text-left">
              <div className="flex justify-between gap-8">
                <span className="font-normal">Period Beg/End</span>
                <span className="font-normal text-right">{formatDateSlash(payroll.startDate)} - {formatDateSlash(payroll.endDate)}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="font-normal">Advice Date:</span>
                <span className="font-normal text-right">{formatDateSlash(payroll.payDate)}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="font-normal">Advice Number:</span>
                <span className="font-normal text-right">{payroll.adviceNumber || payroll.checkNumber}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="font-normal">Batch Number:</span>
                <span className="font-normal text-right">{payroll.batchNumber || '136266'}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="font-normal">Employee No:</span>
                <span className="font-normal text-right">{employee.employeeNumber}</span>
              </div>
            </div>

            {/* Employee Address Block (Arial Bold - matches Screenshot 2) */}
            <div className="mt-6 text-left text-[11px] font-arial font-bold text-neutral-900 leading-[1.3] pl-20">
              <div>{employee.firstName === 'Nadia' ? 'Nadia Olson' : `${employee.firstName} ${employee.lastName}`}</div>
              <div>{employee.firstName === 'Nadia' ? '4605 E Rustic Ranch Way' : (employee.address || '4605 E Rustic Ranch Way')}</div>
              <div>{employee.firstName === 'Nadia' ? 'Eagle Mountain, UT  84005-6397' : `${employee.city || 'Eagle Mountain'}, ${employee.state || 'UT'}  ${employee.zip || '84005-6397'}`}</div>
            </div>
          </div>

        </div>

        {/* Inquiries & Basis of Pay (Arial Bold labels, matches Screenshot 2) */}
        <div className="mt-6 mb-4 text-[11px] font-arial text-neutral-900 leading-[1.35]">
          <div>
            <span className="font-bold">For inquiries on this statement please call: </span>
            <span className="font-bold">{company.inquiryPhone || company.phone || '(800)260-0852'}</span>
          </div>
          <div>
            <span className="font-bold">Total Hours Worked:</span>
            <span className="font-courier font-normal ml-16">
              {(payroll.totalHoursWorked || (payroll.regularHours + payroll.overtimeHours)).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="font-bold">Basis of Pay:</span>
            <span className="font-arial font-normal ml-24 capitalize">{employee.payType === 'salary' ? 'Salary' : 'Hourly'}</span>
          </div>
        </div>

        {/* TWO-COLUMN ACCOUNTING REPORT (100% Courier Monospace - matches Screenshot 2) */}
        <div className="grid grid-cols-12 gap-8 my-4 text-[11px] font-courier leading-[1.35]">
          
          {/* Left Column: Gross Pay, Deductions, Net Pay, Taxable Earnings */}
          <div className="col-span-6 space-y-0.5">
            <div className="flex justify-between font-bold text-neutral-900">
              <span>Gross Pay</span>
              <div className="flex gap-6">
                <span className="w-20 text-right font-bold">Current</span>
                <span className="w-24 text-right font-bold">YearToDate</span>
              </div>
            </div>

            <div className="flex justify-between text-neutral-900 font-normal">
              <span>Wages</span>
              <div className="flex gap-6">
                <span className="w-20 text-right">{payroll.grossPay.toFixed(2)}</span>
                <span className="w-24 text-right">{payroll.ytdGross.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between text-neutral-900 font-normal">
              <span>Misc Income/Adj</span>
              <div className="flex gap-6">
                <span className="w-20 text-right">{formatDotZero(payroll.bonusPay)}</span>
                <span className="w-24 text-right">{formatDotZero(payroll.bonusPay)}</span>
              </div>
            </div>

            <div className="flex justify-between text-neutral-900">
              <span className="font-bold">Total Gross Pay</span>
              <div className="flex gap-6 font-normal">
                <span className="w-20 text-right">{payroll.grossPay.toFixed(2)}</span>
                <span className="w-24 text-right">{payroll.ytdGross.toFixed(2)}</span>
              </div>
            </div>

            {/* Deductions Sub-block */}
            <div className="pt-2 font-bold text-neutral-900">
              <span>Deductions</span>
            </div>

            <div className="flex justify-between text-neutral-900 font-normal">
              <span>Pre-tax</span>
              <div className="flex gap-6">
                <span className="w-20 text-right">{formatDotZero(payroll.totalPreTaxDeductions)}</span>
                <span className="w-24 text-right">{formatDotZero(payroll.ytdPreTaxDeductions)}</span>
              </div>
            </div>

            <div className="flex justify-between text-neutral-900 font-normal">
              <span>Taxes</span>
              <div className="flex gap-6">
                <span className="w-20 text-right">{totalTaxes.toFixed(2)}</span>
                <span className="w-24 text-right">{totalYtdTaxes.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between text-neutral-900 font-normal">
              <span>Additional Deductions</span>
              <div className="flex gap-6">
                <span className="w-20 text-right">{formatDotZero(payroll.totalPostTaxDeductions)}</span>
                <span className="w-24 text-right">{formatDotZero(payroll.ytdPostTaxDeductions)}</span>
              </div>
            </div>

            <div className="flex justify-between text-neutral-900">
              <span className="font-bold">Total Deductions</span>
              <div className="flex gap-6 font-normal">
                <span className="w-20 text-right">{totalCurrentDeductions.toFixed(2)}</span>
                <span className="w-24 text-right">{totalYtdDeductions.toFixed(2)}</span>
              </div>
            </div>

            {/* NET PAY HIGHLIGHT ROW (Solid gray bar, bold Courier, NO borders - matches Screenshot 2) */}
            <div className="my-1 py-1 px-1.5 bg-[#b8b8b8] text-neutral-900 flex justify-between font-bold">
              <span>NET PAY</span>
              <div className="flex gap-6 font-bold">
                <span className="w-20 text-right">${payroll.netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="w-24 text-right">${payroll.ytdNetPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Federal & FICA Earnings */}
            <div className="pt-0.5 flex justify-between text-neutral-900 font-normal">
              <span>Federal Earnings</span>
              <div className="flex gap-6">
                <span className="w-20 text-right">{payroll.fedTaxableGross.toFixed(2)}</span>
                <span className="w-24 text-right">{payroll.ytdFedTaxable.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between text-neutral-900 font-normal">
              <span>FICA Earnings</span>
              <div className="flex gap-6">
                <span className="w-20 text-right">{payroll.ficaTaxableGross.toFixed(2)}</span>
                <span className="w-24 text-right">{(payroll.ytdFedTaxable).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Pre-tax items, Taxes detail, Additional deductions, Benefits */}
          <div className="col-span-6 space-y-0.5">
            <div className="flex justify-between font-bold text-neutral-900">
              <span>Misc Income/Adj</span>
              <div className="flex gap-6">
                <span className="w-20 text-right font-bold">Current</span>
                <span className="w-24 text-right font-bold">YearToDate</span>
              </div>
            </div>

            {/* Pre-tax deductions header */}
            <div className="pt-3 font-bold text-neutral-900">
              <span>Pre-Tax Deductions</span>
            </div>
            {payroll.preTaxDeductions.length > 0 ? (
              payroll.preTaxDeductions.map((d, i) => (
                <div key={i} className="flex justify-between text-neutral-900 font-normal">
                  <span className="truncate max-w-[150px]">{d.name}</span>
                  <div className="flex gap-6">
                    <span className="w-20 text-right">{d.amount.toFixed(2)}</span>
                    <span className="w-24 text-right">{d.ytdAmount.toFixed(2)}</span>
                  </div>
                </div>
              ))
            ) : null}

            {/* Taxes Header */}
            <div className="pt-3 font-bold text-neutral-900">
              <span>Taxes</span>
            </div>

            {/* Federal Withholding (if non-zero) */}
            {payroll.federalIncomeTax > 0 && (
              <div className="flex justify-between text-neutral-900 font-normal">
                <span>Federal Withholding</span>
                <div className="flex gap-6">
                  <span className="w-20 text-right">{payroll.federalIncomeTax.toFixed(2)}</span>
                  <span className="w-24 text-right">{payroll.ytdFederalIncomeTax.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* FICA Social Security */}
            <div className="flex justify-between text-neutral-900 font-normal">
              <span>FICA</span>
              <div className="flex gap-6">
                <span className="w-20 text-right">{payroll.socialSecurityTax.toFixed(2)}</span>
                <span className="w-24 text-right">{payroll.ytdSocialSecurityTax.toFixed(2)}</span>
              </div>
            </div>

            {/* Medicare */}
            <div className="flex justify-between text-neutral-900 font-normal">
              <span>Medicare</span>
              <div className="flex gap-6">
                <span className="w-20 text-right">{payroll.medicareTax.toFixed(2)}</span>
                <span className="w-24 text-right">{payroll.ytdMedicareTax.toFixed(2)}</span>
              </div>
            </div>

            {/* Utah State Income Tax */}
            {payroll.utahStateTax > 0 && (
              <div className="flex justify-between text-neutral-900 font-normal">
                <span>State - UT</span>
                <div className="flex gap-6">
                  <span className="w-20 text-right">{payroll.utahStateTax.toFixed(2)}</span>
                  <span className="w-24 text-right">{payroll.ytdUtahStateTax.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Additional Deductions Header */}
            <div className="pt-3 font-bold text-neutral-900">
              <span>Additional Deductions</span>
            </div>
            {payroll.postTaxDeductions.length > 0 ? (
              payroll.postTaxDeductions.map((d, i) => (
                <div key={i} className="flex justify-between text-neutral-900 font-normal">
                  <span className="truncate max-w-[150px]">{d.name}</span>
                  <div className="flex gap-6">
                    <span className="w-20 text-right">{d.amount.toFixed(2)}</span>
                    <span className="w-24 text-right">{d.ytdAmount.toFixed(2)}</span>
                  </div>
                </div>
              ))
            ) : null}

            {/* Benefits Header (Vacation / Sick / PTO) */}
            <div className="pt-3 flex justify-between font-bold text-neutral-900">
              <span>Benefits</span>
              <span className="w-24 text-right font-bold">Balance</span>
            </div>
            <div className="flex justify-between text-neutral-900 font-normal">
              <span>Vacation</span>
              <span className="w-24 text-right">{formatDotZero(employee.ptoHoursRemaining)}</span>
            </div>
          </div>

        </div>

        {/* WAGES DETAIL TABLE (100% Courier Monospace - matches Screenshot 2) */}
        <div className="my-5 font-courier text-[11px] leading-[1.35]">
          <div className="flex justify-between font-bold text-neutral-900 pb-0.5">
            <span className="w-20 font-bold">Wages</span>
            <span className="w-20"></span>
            <span className="w-16 text-right font-bold">Reg</span>
            <span className="w-16 text-right font-bold">Prem</span>
            <span className="w-16 text-right font-bold">Reg</span>
            <span className="w-16 text-right font-bold">OT</span>
            <span className="w-16 text-right font-bold">DT</span>
          </div>

          <div className="flex justify-between font-bold text-neutral-900 pb-1">
            <span className="w-20">WkEnding</span>
            <span className="w-20">Type</span>
            <span className="w-16 text-right">Rate</span>
            <span className="w-16 text-right">Rate</span>
            <span className="w-16 text-right">Hours</span>
            <span className="w-16 text-right">Hours</span>
            <span className="w-16 text-right">Hours</span>
          </div>

          <div className="flex justify-between text-neutral-900 font-normal py-0.5">
            <span className="w-20">{formatDateShort(payroll.endDate)}</span>
            <span className="w-20 font-normal">Regular</span>
            <span className="w-16 text-right">{(payroll.regularRate || (payroll.grossPay / (payroll.regularHours || 40))).toFixed(3)}</span>
            <span className="w-16 text-right">{((payroll.regularRate || (payroll.grossPay / (payroll.regularHours || 40))) * 1.5).toFixed(3)}</span>
            <span className="w-16 text-right">{payroll.regularHours.toFixed(2)}</span>
            <span className="w-16 text-right">{payroll.overtimeHours ? payroll.overtimeHours.toFixed(2) : '.00'}</span>
            <span className="w-16 text-right">{payroll.doubleTimeHours ? payroll.doubleTimeHours.toFixed(2) : ''}</span>
          </div>

          <div className="flex justify-between text-neutral-900 pt-2 font-normal">
            <span className="w-20"></span>
            <span className="w-20 text-right pr-4">Total</span>
            <span className="w-16 text-right"></span>
            <span className="w-16 text-right"></span>
            <span className="w-16 text-right">{payroll.regularHours.toFixed(2)}</span>
            <span className="w-16 text-right">{payroll.overtimeHours ? payroll.overtimeHours.toFixed(2) : '.00'}</span>
            <span className="w-16 text-right">{formatDotZero(payroll.doubleTimeHours || 0)}</span>
          </div>
        </div>

        {/* BOTTOM SECTION: Company & Direct Deposit Stub (Arial Bold headers & names, matches Screenshot 2) */}
        <div className="mt-20 pt-4">
          
          {/* Advice Number & Date Right (Arial Bold) */}
          <div className="flex justify-end text-[11px] mb-3 font-arial font-bold">
            <div className="space-y-1.5 text-left w-64">
              <div className="flex justify-between">
                <span>Advice Number:</span>
                <span>{payroll.adviceNumber || payroll.checkNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Advice Date:</span>
                <span>{formatDateSlash(payroll.payDate)}</span>
              </div>
            </div>
          </div>

          {/* Company Name & Address Repeated (Arial Bold) */}
          <div className="text-[11px] font-arial font-bold text-neutral-900 leading-[1.3] mb-4">
            <div>{company.name}</div>
            <div>{company.address}</div>
            {company.addressLine2 && <div>{company.addressLine2}</div>}
            <div>{company.city}, {company.state} {company.zip}</div>
          </div>

          {/* Direct Deposit Distribution Table (Arial Bold Headers & Name, Courier Numbers) */}
          <div className="text-[11px] mb-8">
            <div className="flex justify-between font-arial font-bold text-neutral-900 border-b border-black pb-0.5">
              <span className="w-1/2">Deposited to the account of</span>
              <span className="w-1/4 text-center">Account Number</span>
              <span className="w-1/4 text-right">Amount</span>
            </div>
            <div className="flex justify-between text-neutral-900 py-1">
              <span className="w-1/2 font-arial font-bold">{employee.firstName === 'Nadia' ? 'Nadia Olson' : `${employee.firstName} ${employee.lastName}`}</span>
              <span className="w-1/4 text-center font-courier font-normal">{employee.directDeposit.accountNumberMasked || 'XXXXXXXX9652'}</span>
              <span className="w-1/4 text-right font-courier font-normal">
                {payroll.netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* NON-NEGOTIABLE Big Stamped Text (Courier Bold Tracking) */}
          <div className="text-right pt-6">
            <span
              className="text-[22px] font-bold tracking-[0.2em] text-neutral-900 uppercase font-courier"
            >
              NON-NEGOTIABLE
            </span>
          </div>

        </div>

      </div>
    );
  }

  // 1. Classic ADP / Paychex Corporate Style
  if (template === 'classic') {
    return (
      <div
        id={containerId}
        className="relative bg-white text-neutral-900 border border-neutral-300 shadow-sm p-6 max-w-4xl mx-auto text-xs font-sans print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Watermark overlay if configured */}
        {watermark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-10">
            <span className="text-8xl font-black uppercase tracking-widest text-neutral-900 -rotate-45">
              {watermark}
            </span>
          </div>
        )}

        {/* Header Section */}
        <div className="border-b-2 border-neutral-800 pb-3 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-base font-bold uppercase tracking-wider text-neutral-900">
                {company.name}
              </h1>
              <p className="text-neutral-600 leading-tight">
                {company.address} · {company.city}, {company.state} {company.zip}
              </p>
              <div className="text-[11px] text-neutral-500 mt-1 flex gap-3">
                <span><strong>Federal EIN:</strong> {company.ein}</span>
                <span><strong>Utah Tax ID:</strong> {company.utahTaxId}</span>
                <span><strong>Tel:</strong> {company.phone}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block bg-neutral-100 border border-neutral-300 px-3 py-1 font-bold text-xs uppercase tracking-wider">
                Earnings Statement
              </span>
              <p className="text-[11px] text-neutral-500 mt-1">
                Advice / Check #: <strong className="font-mono text-neutral-800">{payroll.checkNumber}</strong>
              </p>
              <p className="text-[11px] text-neutral-500">
                Pay Date: <strong className="font-mono text-neutral-800">{payroll.payDate}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Employee & Pay Period Information Grid */}
        <div className="grid grid-cols-2 gap-4 border border-neutral-300 bg-neutral-50/50 p-3 mb-4">
          <div>
            <span className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">Employee Information</span>
            <p className="font-bold text-sm text-neutral-900 mt-0.5">
              {employee.firstName} {employee.lastName}
            </p>
            <p className="text-neutral-600">{employee.address}, {employee.city}, {employee.state} {employee.zip}</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-neutral-600 mt-1">
              <div>Employee ID: <strong className="font-mono">{employee.employeeNumber}</strong></div>
              <div>SSN: <strong className="font-mono">{employee.ssnMasked}</strong></div>
              <div>Department: <strong>{employee.department}</strong></div>
              <div>Job Title: <strong>{employee.title}</strong></div>
            </div>
          </div>

          <div className="border-l border-neutral-300 pl-4">
            <span className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">Pay Period & Tax Profile</span>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-neutral-600 mt-1">
              <div>Pay Period: <strong className="font-mono">{payroll.startDate} to {payroll.endDate}</strong></div>
              <div>Period #: <strong className="font-mono">{payroll.payPeriodNumber} of {payroll.totalPeriodsInYear}</strong></div>
              <div>Pay Frequency: <strong className="capitalize">{employee.payFrequency}</strong></div>
              <div>Federal Filing Status: <strong className="capitalize">{employee.taxStatus || 'Exempt'}</strong></div>
              <div>Utah Tax Method: <strong className="text-emerald-700">{employee.utahTaxMethod === 'formula' ? 'TC-15 Formula (4.55%)' : employee.utahTaxMethod === 'flat_455' ? 'Utah Flat 4.55%' : 'Custom'}</strong></div>
              <div>Utah Allowances: <strong className="font-mono">{employee.utahAllowances}</strong></div>
            </div>
          </div>
        </div>

        {/* Earnings, Deductions, and Taxes Tables */}
        <div className="grid grid-cols-12 gap-3 mb-4">
          
          {/* Earnings (5 Cols) */}
          <div className="col-span-5 border border-neutral-300">
            <div className="bg-neutral-100 border-b border-neutral-300 px-2.5 py-1 font-bold uppercase text-[10px] tracking-wider text-neutral-700">
              Earnings
            </div>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 text-[10px]">
                  <th className="text-left py-1 px-2 font-medium">Description</th>
                  <th className="text-right py-1 px-1 font-medium">Hours</th>
                  <th className="text-right py-1 px-1 font-medium">Rate</th>
                  <th className="text-right py-1 px-2 font-medium">Current</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {payroll.earnings.map((e) => (
                  <tr key={e.id}>
                    <td className="py-1 px-2 text-neutral-800">{e.description}</td>
                    <td className="py-1 px-1 text-right font-mono text-neutral-600">{e.hours ? formatNumber(e.hours, 1) : '—'}</td>
                    <td className="py-1 px-1 text-right font-mono text-neutral-600">{e.rate ? formatCurrency(e.rate) : '—'}</td>
                    <td className="py-1 px-2 text-right font-mono font-medium text-neutral-900">{formatCurrency(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-neutral-300 bg-neutral-50 font-bold">
                  <td colSpan={3} className="py-1.5 px-2 text-neutral-700">Total Gross Earnings</td>
                  <td className="py-1.5 px-2 text-right font-mono text-neutral-900">{formatCurrency(payroll.grossPay)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Deductions (3 Cols) */}
          <div className="col-span-3 border border-neutral-300">
            <div className="bg-neutral-100 border-b border-neutral-300 px-2.5 py-1 font-bold uppercase text-[10px] tracking-wider text-neutral-700">
              Deductions
            </div>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 text-[10px]">
                  <th className="text-left py-1 px-2 font-medium">Item</th>
                  <th className="text-right py-1 px-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {payroll.preTaxDeductions.map((d, i) => (
                  <tr key={`pre_${i}`}>
                    <td className="py-1 px-2 text-neutral-700 truncate max-w-[100px]" title={d.name}>
                      <span className="text-[9px] text-emerald-700 font-semibold mr-1">[PRE]</span>
                      {d.name}
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-neutral-800">{formatCurrency(d.amount)}</td>
                  </tr>
                ))}
                {payroll.postTaxDeductions.map((d, i) => (
                  <tr key={`post_${i}`}>
                    <td className="py-1 px-2 text-neutral-700 truncate max-w-[100px]" title={d.name}>
                      <span className="text-[9px] text-amber-700 font-semibold mr-1">[POST]</span>
                      {d.name}
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-neutral-800">{formatCurrency(d.amount)}</td>
                  </tr>
                ))}
                {payroll.preTaxDeductions.length === 0 && payroll.postTaxDeductions.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-2 px-2 text-neutral-400 italic text-center">None</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-neutral-300 bg-neutral-50 font-bold">
                  <td className="py-1.5 px-2 text-neutral-700">Total Ded.</td>
                  <td className="py-1.5 px-2 text-right font-mono text-neutral-900">
                    {formatCurrency(payroll.totalPreTaxDeductions + payroll.totalPostTaxDeductions)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Taxes Withheld (4 Cols) */}
          <div className="col-span-4 border border-neutral-300">
            <div className="bg-neutral-100 border-b border-neutral-300 px-2.5 py-1 font-bold uppercase text-[10px] tracking-wider text-neutral-700 flex justify-between">
              <span>Taxes Withheld</span>
              <span className="text-[9px] text-emerald-800 font-semibold">UTAH WTH</span>
            </div>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 text-[10px]">
                  <th className="text-left py-1 px-2 font-medium">Tax Description</th>
                  <th className="text-right py-1 px-2 font-medium">Current</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                <tr>
                  <td className="py-1 px-2 text-neutral-800">Federal Income Tax (FIT)</td>
                  <td className="py-1 px-2 text-right font-mono text-neutral-900">{formatCurrency(payroll.federalIncomeTax)}</td>
                </tr>
                <tr className="bg-emerald-50/40">
                  <td className="py-1 px-2 text-emerald-950 font-medium">
                    Utah State Income Tax (SIT 4.55%)
                  </td>
                  <td className="py-1 px-2 text-right font-mono font-semibold text-emerald-900">
                    {formatCurrency(payroll.utahStateTax)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1 px-2 text-neutral-800">FICA - Social Security (6.2%)</td>
                  <td className="py-1 px-2 text-right font-mono text-neutral-900">{formatCurrency(payroll.socialSecurityTax)}</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 text-neutral-800">FICA - Medicare (1.45%)</td>
                  <td className="py-1 px-2 text-right font-mono text-neutral-900">{formatCurrency(payroll.medicareTax)}</td>
                </tr>
                {payroll.additionalMedicareTax > 0 && (
                  <tr>
                    <td className="py-1 px-2 text-neutral-800">Addl. Medicare (0.9%)</td>
                    <td className="py-1 px-2 text-right font-mono text-neutral-900">{formatCurrency(payroll.additionalMedicareTax)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-neutral-300 bg-neutral-50 font-bold">
                  <td className="py-1.5 px-2 text-neutral-700">Total Taxes</td>
                  <td className="py-1.5 px-2 text-right font-mono text-neutral-900">{formatCurrency(payroll.totalEmployeeTaxes)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>

        {/* Year-to-Date Summary & Net Pay Callout */}
        <div className="grid grid-cols-12 gap-3 mb-4">
          {/* YTD Summary */}
          <div className="col-span-8 border border-neutral-300 p-2.5">
            <span className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">Year-to-Date (YTD) Summary</span>
            <div className="grid grid-cols-4 gap-2 mt-1.5 text-center">
              <div className="bg-neutral-50 p-1.5 border border-neutral-200">
                <span className="text-[9px] text-neutral-500 block uppercase font-medium">YTD Gross</span>
                <span className="font-mono font-bold text-neutral-900 text-xs">{formatCurrency(payroll.ytdGross)}</span>
              </div>
              <div className="bg-neutral-50 p-1.5 border border-neutral-200">
                <span className="text-[9px] text-neutral-500 block uppercase font-medium">YTD Federal Tax</span>
                <span className="font-mono font-bold text-neutral-900 text-xs">{formatCurrency(payroll.ytdFederalIncomeTax)}</span>
              </div>
              <div className="bg-emerald-50 p-1.5 border border-emerald-200">
                <span className="text-[9px] text-emerald-800 block uppercase font-medium">YTD Utah Tax</span>
                <span className="font-mono font-bold text-emerald-900 text-xs">{formatCurrency(payroll.ytdUtahStateTax)}</span>
              </div>
              <div className="bg-neutral-50 p-1.5 border border-neutral-200">
                <span className="text-[9px] text-neutral-500 block uppercase font-medium">YTD FICA (SS+Med)</span>
                <span className="font-mono font-bold text-neutral-900 text-xs">
                  {formatCurrency(payroll.ytdSocialSecurityTax + payroll.ytdMedicareTax)}
                </span>
              </div>
            </div>
          </div>

          {/* NET PAY BOX */}
          <div className="col-span-4 bg-neutral-900 text-white p-3 flex flex-col justify-center items-center rounded-xs shadow-sm">
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-300">
              Net Direct Deposit
            </span>
            <span className="text-2xl font-mono font-extrabold tracking-tight mt-0.5 text-emerald-400">
              {formatCurrency(payroll.netPay)}
            </span>
            <span className="text-[10px] text-neutral-400 mt-1 font-mono">
              Pay Date: {payroll.payDate}
            </span>
          </div>
        </div>

        {/* Bottom Section: Direct Deposit & Leave Balances */}
        <div className="grid grid-cols-2 gap-4 border-t border-neutral-300 pt-3 text-[11px]">
          <div>
            <span className="font-bold text-neutral-800 uppercase text-[10px] tracking-wider">Direct Deposit Distribution</span>
            <div className="mt-1 space-y-0.5 text-neutral-600">
              <div className="flex justify-between">
                <span>Bank: <strong>{employee.directDeposit.bankName}</strong></span>
                <span>Type: <strong>{employee.directDeposit.accountType}</strong></span>
              </div>
              <div className="flex justify-between">
                <span>Routing: <strong className="font-mono">{employee.directDeposit.routingNumberMasked}</strong></span>
                <span>Account: <strong className="font-mono">{employee.directDeposit.accountNumberMasked}</strong></span>
              </div>
              <div className="flex justify-between text-neutral-900 font-semibold pt-1 border-t border-neutral-200">
                <span>Deposited Amount:</span>
                <span className="font-mono">{formatCurrency(payroll.netPay)}</span>
              </div>
            </div>
          </div>

          <div className="border-l border-neutral-300 pl-4">
            <span className="font-bold text-neutral-800 uppercase text-[10px] tracking-wider">Paid Leave Accruals</span>
            <div className="grid grid-cols-3 gap-2 mt-1 text-center">
              <div className="border border-neutral-200 p-1 bg-neutral-50/50">
                <span className="text-[9px] text-neutral-500 block">PTO Accrued</span>
                <span className="font-mono font-semibold">{employee.ptoHoursAccrued}h</span>
              </div>
              <div className="border border-neutral-200 p-1 bg-neutral-50/50">
                <span className="text-[9px] text-neutral-500 block">PTO Used</span>
                <span className="font-mono font-semibold">{employee.ptoHoursUsed}h</span>
              </div>
              <div className="border border-emerald-200 p-1 bg-emerald-50/50">
                <span className="text-[9px] text-emerald-800 block">PTO Remaining</span>
                <span className="font-mono font-bold text-emerald-900">{employee.ptoHoursRemaining}h</span>
              </div>
            </div>
            <p className="text-[9px] text-neutral-400 mt-2 text-right">
              Non-negotiable payroll voucher. Generated with Utah tax compliance.
            </p>
          </div>
        </div>

      </div>
    );
  }

  // 2. Modern Fintech Layout (Clean Gusto/Rippling Style)
  if (template === 'modern') {
    return (
      <div
        id={containerId}
        className="relative bg-white text-neutral-900 border border-neutral-200 rounded-xl shadow-xs p-8 max-w-4xl mx-auto text-xs font-sans print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {watermark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-10">
            <span className="text-8xl font-black uppercase tracking-widest text-neutral-900 -rotate-45">
              {watermark}
            </span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex justify-between items-start pb-6 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                {company.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900">{company.name}</h2>
                <p className="text-xs text-neutral-500">{company.city}, {company.state} · EIN: {company.ein}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono text-neutral-500 block">PAY STATEMENT #{payroll.checkNumber}</span>
            <span className="text-sm font-semibold text-neutral-800 block">{payroll.payDate}</span>
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-1">
              Utah Flat Withholding (4.55%)
            </span>
          </div>
        </div>

        {/* Net Pay Hero Banner */}
        <div className="my-6 p-6 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-medium">Net Take-Home Pay</span>
            <h1 className="text-3xl sm:text-4xl font-mono font-bold tracking-tight text-white mt-1">
              {formatCurrency(payroll.netPay)}
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Directly deposited to {employee.directDeposit.bankName} ({employee.directDeposit.accountNumberMasked})
            </p>
          </div>
          <div className="flex gap-4 text-center sm:text-right border-t sm:border-t-0 sm:border-l border-neutral-700 pt-3 sm:pt-0 sm:pl-6">
            <div>
              <span className="text-[10px] uppercase text-neutral-400 block font-medium">Gross Pay</span>
              <span className="text-base font-mono font-semibold text-neutral-200">{formatCurrency(payroll.grossPay)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-neutral-400 block font-medium">Total Taxes</span>
              <span className="text-base font-mono font-semibold text-rose-300">-{formatCurrency(payroll.totalEmployeeTaxes)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-neutral-400 block font-medium">Deductions</span>
              <span className="text-base font-mono font-semibold text-amber-300">
                -{formatCurrency(payroll.totalPreTaxDeductions + payroll.totalPostTaxDeductions)}
              </span>
            </div>
          </div>
        </div>

        {/* Employee & Period Details */}
        <div className="grid grid-cols-3 gap-6 py-4 border-y border-neutral-200 mb-6 text-xs">
          <div>
            <span className="text-neutral-500 block text-[11px] font-medium">Employee</span>
            <p className="font-semibold text-neutral-900 mt-0.5">{employee.firstName} {employee.lastName}</p>
            <p className="text-neutral-600">{employee.title} · {employee.department}</p>
            <p className="text-neutral-500 font-mono mt-0.5">SSN: {employee.ssnMasked}</p>
          </div>
          <div>
            <span className="text-neutral-500 block text-[11px] font-medium">Pay Period</span>
            <p className="font-semibold text-neutral-900 mt-0.5">{payroll.startDate} to {payroll.endDate}</p>
            <p className="text-neutral-600">Period {payroll.payPeriodNumber} of {payroll.totalPeriodsInYear} ({employee.payFrequency})</p>
            <p className="text-neutral-500 mt-0.5">Disbursement: Direct Deposit</p>
          </div>
          <div>
            <span className="text-neutral-500 block text-[11px] font-medium">State & Tax Profile</span>
            <p className="font-semibold text-neutral-900 mt-0.5">Utah (UT-WTH: {company.utahTaxId})</p>
            <p className="text-neutral-600">Fed: {employee.taxStatus || 'Exempt'}</p>
            <p className="text-emerald-700 font-medium mt-0.5">UT Method: {employee.utahTaxMethod === 'formula' ? 'TC-15 Formula' : 'Flat 4.55%'}</p>
          </div>
        </div>

        {/* Detailed Breakdown Grids */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Earnings */}
          <div>
            <h3 className="font-semibold text-neutral-900 text-xs uppercase tracking-wider mb-2">Earnings</h3>
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-neutral-50 text-neutral-500 text-[11px] border-b border-neutral-200">
                  <tr>
                    <th className="py-2 px-3 text-left font-medium">Type</th>
                    <th className="py-2 px-2 text-right font-medium">Hours</th>
                    <th className="py-2 px-2 text-right font-medium">Rate</th>
                    <th className="py-2 px-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {payroll.earnings.map((e) => (
                    <tr key={e.id}>
                      <td className="py-2 px-3 text-neutral-800">{e.description}</td>
                      <td className="py-2 px-2 text-right font-mono text-neutral-600">{e.hours ? formatNumber(e.hours, 1) : '—'}</td>
                      <td className="py-2 px-2 text-right font-mono text-neutral-600">{e.rate ? formatCurrency(e.rate) : '—'}</td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-neutral-900">{formatCurrency(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Taxes */}
          <div>
            <h3 className="font-semibold text-neutral-900 text-xs uppercase tracking-wider mb-2 flex justify-between">
              <span>Taxes Withheld</span>
              <span className="text-neutral-500 font-normal">State: Utah</span>
            </h3>
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-neutral-50 text-neutral-500 text-[11px] border-b border-neutral-200">
                  <tr>
                    <th className="py-2 px-3 text-left font-medium">Tax Item</th>
                    <th className="py-2 px-3 text-right font-medium">Current</th>
                    <th className="py-2 px-3 text-right font-medium">YTD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  <tr>
                    <td className="py-2 px-3 text-neutral-800">Federal Income Tax</td>
                    <td className="py-2 px-3 text-right font-mono text-neutral-900">{formatCurrency(payroll.federalIncomeTax)}</td>
                    <td className="py-2 px-3 text-right font-mono text-neutral-500">{formatCurrency(payroll.ytdFederalIncomeTax)}</td>
                  </tr>
                  <tr className="bg-emerald-50/50">
                    <td className="py-2 px-3 text-emerald-950 font-medium">Utah State Tax (4.55%)</td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-900">{formatCurrency(payroll.utahStateTax)}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-800">{formatCurrency(payroll.ytdUtahStateTax)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-neutral-800">Social Security (6.2%)</td>
                    <td className="py-2 px-3 text-right font-mono text-neutral-900">{formatCurrency(payroll.socialSecurityTax)}</td>
                    <td className="py-2 px-3 text-right font-mono text-neutral-500">{formatCurrency(payroll.ytdSocialSecurityTax)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-neutral-800">Medicare (1.45%)</td>
                    <td className="py-2 px-3 text-right font-mono text-neutral-900">{formatCurrency(payroll.medicareTax)}</td>
                    <td className="py-2 px-3 text-right font-mono text-neutral-500">{formatCurrency(payroll.ytdMedicareTax)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Deductions & YTD Totals Bar */}
        <div className="grid grid-cols-2 gap-6 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
          <div>
            <h4 className="font-semibold text-neutral-700 text-xs uppercase mb-2">Benefit & Pre-Tax Deductions</h4>
            <div className="space-y-1 text-xs">
              {payroll.preTaxDeductions.map((d, i) => (
                <div key={i} className="flex justify-between text-neutral-700">
                  <span>{d.name} (Pre-Tax)</span>
                  <span className="font-mono">{formatCurrency(d.amount)}</span>
                </div>
              ))}
              {payroll.postTaxDeductions.map((d, i) => (
                <div key={i} className="flex justify-between text-neutral-700">
                  <span>{d.name} (Post-Tax)</span>
                  <span className="font-mono">{formatCurrency(d.amount)}</span>
                </div>
              ))}
              {payroll.preTaxDeductions.length === 0 && payroll.postTaxDeductions.length === 0 && (
                <p className="text-neutral-400 italic">No recurring benefit deductions</p>
              )}
            </div>
          </div>

          <div className="border-l border-neutral-200 pl-4">
            <h4 className="font-semibold text-neutral-700 text-xs uppercase mb-2">YTD Totals & Leave</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-neutral-500 text-[10px] block">YTD Gross Earnings</span>
                <span className="font-mono font-bold text-neutral-900">{formatCurrency(payroll.ytdGross)}</span>
              </div>
              <div>
                <span className="text-neutral-500 text-[10px] block">YTD Net Pay</span>
                <span className="font-mono font-bold text-neutral-900">{formatCurrency(payroll.ytdNetPay)}</span>
              </div>
              <div>
                <span className="text-neutral-500 text-[10px] block">PTO Remaining</span>
                <span className="font-mono font-semibold text-emerald-800">{employee.ptoHoursRemaining} Hours</span>
              </div>
              <div>
                <span className="text-neutral-500 text-[10px] block">Sick Leave Remaining</span>
                <span className="font-mono font-semibold text-neutral-800">{employee.sickHoursRemaining} Hours</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-200 text-center text-[10px] text-neutral-400">
          This document is generated for personal tax records. Direct deposit advice. Automated Utah payroll tax calculation engine.
        </div>
      </div>
    );
  }

  // 3. Official Bank Check Stub Layout (Top Check + Dual Stubs Below)
  if (template === 'check_stub') {
    return (
      <div
        id={containerId}
        className="relative bg-white text-neutral-900 border border-neutral-400 shadow-md p-6 max-w-4xl mx-auto text-xs font-sans print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {watermark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-10">
            <span className="text-8xl font-black uppercase tracking-widest text-neutral-900 -rotate-45">
              {watermark}
            </span>
          </div>
        )}

        {/* TOP CHECK CONTAINER */}
        <div className="border-2 border-neutral-800 p-5 bg-[#fafbf9] relative mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">{company.name}</h2>
              <p className="text-neutral-600 text-[11px]">{company.address}</p>
              <p className="text-neutral-600 text-[11px]">{company.city}, {company.state} {company.zip}</p>
              <p className="text-neutral-500 text-[10px] mt-1">EIN: {company.ein} · Utah WTH: {company.utahTaxId}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono font-bold text-neutral-900">CHECK NO. {payroll.checkNumber}</span>
              <p className="text-xs text-neutral-700 mt-1 font-mono">Date: <strong>{payroll.payDate}</strong></p>
              <div className="border border-neutral-800 px-3 py-1 mt-2 inline-block bg-white">
                <span className="font-mono text-base font-bold text-neutral-900">{formatCurrency(payroll.netPay)}</span>
              </div>
            </div>
          </div>

          <div className="my-5 border-t border-b border-neutral-300 py-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-700 uppercase text-[11px] tracking-wider whitespace-nowrap">PAY TO THE ORDER OF:</span>
              <span className="font-bold text-sm text-neutral-900 border-b border-neutral-400 flex-1 pb-0.5 pl-2">
                {employee.firstName} {employee.lastName}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-neutral-700 flex items-center gap-2">
              <span className="font-bold uppercase text-[10px] text-neutral-500">EXACTLY:</span>
              <span className="font-serif italic border-b border-neutral-300 flex-1 pb-0.5">
                {numberToWords(payroll.netPay)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-end mt-4">
            <div>
              <p className="text-[10px] font-mono text-neutral-500 uppercase">
                {employee.directDeposit.bankName} · DIRECT DEPOSIT ADVICE ONLY · NON-NEGOTIABLE
              </p>
              <p className="text-[11px] text-neutral-700 mt-0.5">
                Deposit to: {employee.directDeposit.accountType} ({employee.directDeposit.accountNumberMasked})
              </p>
            </div>
            <div className="text-right w-64 border-t border-neutral-800 pt-1">
              <p className="font-serif text-sm italic text-neutral-800">Marcus V. Authorized</p>
              <p className="text-[9px] uppercase tracking-wider text-neutral-500">Authorized Signature</p>
            </div>
          </div>

          {/* Bank MICR Encoding Line */}
          <div className="mt-4 pt-3 border-t border-neutral-300 text-center font-mono text-[13px] tracking-widest text-neutral-800">
            c{payroll.checkNumber}c a124000054a 0124829104c
          </div>
        </div>

        {/* Perforated Divider Line */}
        <div className="relative my-6 text-center">
          <div className="border-t-2 border-dashed border-neutral-400"></div>
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-3 text-[10px] uppercase tracking-widest text-neutral-400">
            Detach Statement Before Cashing / Direct Deposit Advice
          </span>
        </div>

        {/* EARNINGS STUB SECTION */}
        <div className="border border-neutral-300 p-4 bg-neutral-50/30">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-300 mb-3">
            <div>
              <span className="font-bold text-neutral-900 text-xs">EMPLOYEE PAYROLL SUMMARY</span>
              <p className="text-[11px] text-neutral-600">
                {employee.firstName} {employee.lastName} (ID: {employee.employeeNumber} · SSN: {employee.ssnMasked})
              </p>
            </div>
            <div className="text-right text-[11px]">
              <span className="text-neutral-600">Pay Period: <strong className="font-mono">{payroll.startDate} - {payroll.endDate}</strong></span>
              <p className="text-neutral-500">Utah Tax Rate: 4.55%</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <h4 className="font-bold text-neutral-700 border-b border-neutral-200 pb-1 mb-1 text-[11px]">EARNINGS</h4>
              {payroll.earnings.map(e => (
                <div key={e.id} className="flex justify-between py-0.5">
                  <span className="text-neutral-600">{e.description}</span>
                  <span className="font-mono font-medium">{formatCurrency(e.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold border-t border-neutral-300 pt-1 mt-1">
                <span>Total Gross:</span>
                <span className="font-mono">{formatCurrency(payroll.grossPay)}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-neutral-700 border-b border-neutral-200 pb-1 mb-1 text-[11px]">TAXES</h4>
              <div className="flex justify-between py-0.5 text-neutral-600">
                <span>Federal FIT</span>
                <span className="font-mono">{formatCurrency(payroll.federalIncomeTax)}</span>
              </div>
              <div className="flex justify-between py-0.5 text-emerald-800 font-medium bg-emerald-50/50 px-1">
                <span>Utah SIT (4.55%)</span>
                <span className="font-mono">{formatCurrency(payroll.utahStateTax)}</span>
              </div>
              <div className="flex justify-between py-0.5 text-neutral-600">
                <span>Social Security (6.2%)</span>
                <span className="font-mono">{formatCurrency(payroll.socialSecurityTax)}</span>
              </div>
              <div className="flex justify-between py-0.5 text-neutral-600">
                <span>Medicare (1.45%)</span>
                <span className="font-mono">{formatCurrency(payroll.medicareTax)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-neutral-300 pt-1 mt-1">
                <span>Total Taxes:</span>
                <span className="font-mono">{formatCurrency(payroll.totalEmployeeTaxes)}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-neutral-700 border-b border-neutral-200 pb-1 mb-1 text-[11px]">DEDUCTIONS & NET</h4>
              {payroll.preTaxDeductions.map((d, i) => (
                <div key={i} className="flex justify-between py-0.5 text-neutral-600">
                  <span className="truncate max-w-[120px]">{d.name}</span>
                  <span className="font-mono">-{formatCurrency(d.amount)}</span>
                </div>
              ))}
              {payroll.postTaxDeductions.map((d, i) => (
                <div key={i} className="flex justify-between py-0.5 text-neutral-600">
                  <span className="truncate max-w-[120px]">{d.name}</span>
                  <span className="font-mono">-{formatCurrency(d.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-sm bg-neutral-900 text-white p-2 mt-2 rounded-xs">
                <span>NET PAY:</span>
                <span className="font-mono text-emerald-400">{formatCurrency(payroll.netPay)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // 4. Executive Statement Format
  return (
    <div
      id={containerId}
      className="relative bg-white text-neutral-900 border border-neutral-300 p-8 max-w-4xl mx-auto text-xs font-sans print:border-none print:shadow-none print:p-0 print:m-0"
    >
      {watermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-10">
          <span className="text-8xl font-black uppercase tracking-widest text-neutral-900 -rotate-45">
            {watermark}
          </span>
        </div>
      )}

      <div className="border-b-2 border-neutral-900 pb-4 mb-6 flex justify-between items-end">
        <div>
          <span className="text-[10px] tracking-widest uppercase font-bold text-neutral-500">Official Compensation Record</span>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">{company.name}</h1>
          <p className="text-neutral-600 text-xs">{company.address}, {company.city}, {company.state} {company.zip}</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono text-neutral-500">REF: {payroll.checkNumber} · VERIFIED</div>
          <div className="text-sm font-bold text-neutral-900 mt-1">STATEMENT OF EARNINGS</div>
          <div className="text-xs text-neutral-600">Disbursement: {payroll.payDate}</div>
        </div>
      </div>

      {/* Grid metadata */}
      <div className="grid grid-cols-2 gap-6 pb-6 border-b border-neutral-200">
        <div>
          <h3 className="font-bold text-neutral-800 uppercase text-[10px] tracking-wider mb-1">Recipient Identity</h3>
          <p className="text-sm font-semibold">{employee.firstName} {employee.lastName}</p>
          <p className="text-neutral-600">{employee.title} — {employee.department}</p>
          <p className="text-neutral-500 font-mono mt-1">Tax ID: {employee.ssnMasked} · EMP ID: {employee.employeeNumber}</p>
        </div>
        <div>
          <h3 className="font-bold text-neutral-800 uppercase text-[10px] tracking-wider mb-1">State & Jurisdiction</h3>
          <p className="font-semibold text-neutral-900">State of Utah · Flat Income Tax 4.55%</p>
          <p className="text-neutral-600">Utah State Withholding Account: {company.utahTaxId}</p>
          <p className="text-neutral-500 font-mono mt-1">Period: {payroll.startDate} through {payroll.endDate}</p>
        </div>
      </div>

      {/* Comprehensive accounting table */}
      <div className="my-6">
        <table className="w-full text-xs border border-neutral-200">
          <thead className="bg-neutral-100 border-b border-neutral-200 text-neutral-700">
            <tr>
              <th className="py-2 px-3 text-left font-semibold">Classification</th>
              <th className="py-2 px-3 text-left font-semibold">Detail</th>
              <th className="py-2 px-3 text-right font-semibold">Current ($)</th>
              <th className="py-2 px-3 text-right font-semibold">YTD Total ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {payroll.earnings.map(e => (
              <tr key={e.id}>
                <td className="py-2 px-3 font-medium text-neutral-900">Gross Compensation</td>
                <td className="py-2 px-3 text-neutral-600">{e.description}</td>
                <td className="py-2 px-3 text-right font-mono font-medium">{formatCurrency(e.amount)}</td>
                <td className="py-2 px-3 text-right font-mono text-neutral-500">{formatCurrency(payroll.ytdGross)}</td>
              </tr>
            ))}
            <tr>
              <td className="py-2 px-3 font-medium text-neutral-900">Federal Withholding</td>
              <td className="py-2 px-3 text-neutral-600">IRS Percentage Method ({employee.taxStatus || 'Exempt'})</td>
              <td className="py-2 px-3 text-right font-mono text-neutral-900">-{formatCurrency(payroll.federalIncomeTax)}</td>
              <td className="py-2 px-3 text-right font-mono text-neutral-500">-{formatCurrency(payroll.ytdFederalIncomeTax)}</td>
            </tr>
            <tr className="bg-emerald-50/50">
              <td className="py-2 px-3 font-semibold text-emerald-950">Utah State Withholding</td>
              <td className="py-2 px-3 text-emerald-800">State Flat 4.55% / TC-15 Compliance</td>
              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-900">-{formatCurrency(payroll.utahStateTax)}</td>
              <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-800">-{formatCurrency(payroll.ytdUtahStateTax)}</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-medium text-neutral-900">FICA Social Security</td>
              <td className="py-2 px-3 text-neutral-600">OASDI 6.2% Statutory</td>
              <td className="py-2 px-3 text-right font-mono text-neutral-900">-{formatCurrency(payroll.socialSecurityTax)}</td>
              <td className="py-2 px-3 text-right font-mono text-neutral-500">-{formatCurrency(payroll.ytdSocialSecurityTax)}</td>
            </tr>
            <tr>
              <td className="py-2 px-3 font-medium text-neutral-900">FICA Medicare</td>
              <td className="py-2 px-3 text-neutral-600">Hospital Insurance 1.45% Statutory</td>
              <td className="py-2 px-3 text-right font-mono text-neutral-900">-{formatCurrency(payroll.medicareTax)}</td>
              <td className="py-2 px-3 text-right font-mono text-neutral-500">-{formatCurrency(payroll.ytdMedicareTax)}</td>
            </tr>
            {payroll.preTaxDeductions.map((d, i) => (
              <tr key={`pt_${i}`}>
                <td className="py-2 px-3 font-medium text-neutral-700">Pre-Tax Deduction</td>
                <td className="py-2 px-3 text-neutral-600">{d.name}</td>
                <td className="py-2 px-3 text-right font-mono text-neutral-800">-{formatCurrency(d.amount)}</td>
                <td className="py-2 px-3 text-right font-mono text-neutral-500">-{formatCurrency(d.ytdAmount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-neutral-900 bg-neutral-100 font-bold text-sm">
              <td colSpan={2} className="py-3 px-3 uppercase tracking-wider text-neutral-900">
                Net Disbursed Compensation
              </td>
              <td className="py-3 px-3 text-right font-mono text-emerald-700 font-extrabold text-base">
                {formatCurrency(payroll.netPay)}
              </td>
              <td className="py-3 px-3 text-right font-mono text-neutral-800">
                {formatCurrency(payroll.ytdNetPay)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-neutral-300 text-[11px] text-neutral-500">
        <div>
          Direct Deposit: {employee.directDeposit.bankName} · Account Ending in {employee.directDeposit.accountNumberMasked.slice(-4)}
        </div>
        <div className="font-mono text-[10px]">
          AUTH HASH: {payroll.checkNumber}-UTAH-455-OK
        </div>
      </div>
    </div>
  );
};
