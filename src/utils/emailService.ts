import { CalculatedPayroll, Company, EmailDispatchRecord, Employee } from '../types/payroll';
import { formatCurrency } from './taxCalculator';

export function buildPaystubEmailContent(
  employee: Employee,
  company: Company,
  payroll: CalculatedPayroll
) {
  const subject = `Paystub: ${company.name} - Pay Date ${payroll.payDate} ($${payroll.netPay.toFixed(2)})`;
  
  const bodyText = `Dear ${employee.firstName} ${employee.lastName},

Your earnings statement for the pay period ${payroll.startDate} to ${payroll.endDate} is now available.

PAYMENT SUMMARY:
• Gross Earnings: ${formatCurrency(payroll.grossPay)}
• Utah State Income Tax: ${formatCurrency(payroll.utahStateTax)}
• Federal Income Tax: ${formatCurrency(payroll.federalIncomeTax)}
• Social Security (6.2%): ${formatCurrency(payroll.socialSecurityTax)}
• Medicare (1.45%): ${formatCurrency(payroll.medicareTax)}
• Total Deductions: ${formatCurrency(payroll.totalPreTaxDeductions + payroll.totalPostTaxDeductions)}
--------------------------------------------------
• NET PAY (DIRECT DEPOSIT): ${formatCurrency(payroll.netPay)}
--------------------------------------------------

DISBURSEMENT DETAILS:
• Bank: ${employee.directDeposit.bankName}
• Account: ${employee.directDeposit.accountType} (${employee.directDeposit.accountNumberMasked})
• Direct Deposit Date: ${payroll.payDate}
• Check / Advice No: #${payroll.checkNumber}

YEAR-TO-DATE (YTD) TOTALS:
• YTD Gross Pay: ${formatCurrency(payroll.ytdGross)}
• YTD Utah State Tax: ${formatCurrency(payroll.ytdUtahStateTax)}
• YTD Federal Tax: ${formatCurrency(payroll.ytdFederalIncomeTax)}
• YTD Net Pay: ${formatCurrency(payroll.ytdNetPay)}

PTO & LEAVE BALANCES:
• PTO Remaining: ${employee.ptoHoursRemaining} hrs
• Sick Leave Remaining: ${employee.sickHoursRemaining} hrs

An official PDF paystub has been generated and attached to this statement record.
For security questions or payroll inquiries, please contact ${company.email} or call ${company.phone}.

${company.name}
${company.address}, ${company.city}, ${company.state} ${company.zip}
EIN: ${company.ein} · Utah Tax Commission ID: ${company.utahTaxId}`;

  return { subject, bodyText };
}

export function openInGmailWeb(employee: Employee, company: Company, payroll: CalculatedPayroll) {
  const { subject, bodyText } = buildPaystubEmailContent(employee, company, payroll);
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    employee.email
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
  
  window.open(gmailUrl, '_blank', 'noopener,noreferrer');
}

export function openInMailto(employee: Employee, company: Company, payroll: CalculatedPayroll) {
  const { subject, bodyText } = buildPaystubEmailContent(employee, company, payroll);
  const mailtoUrl = `mailto:${encodeURIComponent(employee.email)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(bodyText)}`;
  
  window.location.href = mailtoUrl;
}

export async function simulateEmailDelivery(
  employee: Employee,
  company: Company,
  payroll: CalculatedPayroll,
  delayMs: number = 800
): Promise<EmailDispatchRecord> {
  // Simulate network dispatch with realistic latency
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  const trackingId = `UT-PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const record: EmailDispatchRecord = {
    id: `disp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    employeeId: employee.id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    recipientEmail: employee.email,
    payPeriod: `${payroll.startDate} to ${payroll.endDate}`,
    netPay: payroll.netPay,
    sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', month: 'short', day: 'numeric', year: 'numeric' }),
    status: 'sent',
    trackingNumber: trackingId,
    notes: `Delivered via Utah Payroll Direct Mail Server with attached official PDF. Direct deposit to ${employee.directDeposit.bankName}.`,
  };

  return record;
}
