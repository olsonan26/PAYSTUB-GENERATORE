import React, { useState } from 'react';
import { Company, EmailDispatchRecord, Employee, PayPeriodInput } from '../types/payroll';
import { calculatePayroll, formatCurrency } from '../utils/taxCalculator';
import { simulateEmailDelivery } from '../utils/emailService';
import { Send, CheckCircle2, Clock, Mail, X } from 'lucide-react';

interface BatchProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  company: Company;
  payPeriod: PayPeriodInput;
  onRecordDispatch: (record: EmailDispatchRecord) => void;
}

interface BatchEmployeeStatus {
  employee: Employee;
  status: 'idle' | 'sending' | 'completed' | 'failed';
  trackingNumber?: string;
  netPay: number;
}

export const BatchProcessingModal: React.FC<BatchProcessingModalProps> = ({
  isOpen,
  onClose,
  employees,
  company,
  payPeriod,
  onRecordDispatch,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [employeeStatuses, setEmployeeStatuses] = useState<BatchEmployeeStatus[]>(() =>
    employees.map((emp) => {
      const payroll = calculatePayroll(emp, payPeriod, company.sutaRate);
      return {
        employee: emp,
        status: 'idle',
        netPay: payroll.netPay,
      };
    })
  );

  if (!isOpen) return null;

  // Calculate totals for payroll run
  const totals = employees.reduce(
    (acc, emp) => {
      const p = calculatePayroll(emp, payPeriod, company.sutaRate);
      acc.gross += p.grossPay;
      acc.utahTax += p.utahStateTax;
      acc.federalTax += p.federalIncomeTax;
      acc.fica += p.socialSecurityTax + p.medicareTax;
      acc.net += p.netPay;
      return acc;
    },
    { gross: 0, utahTax: 0, federalTax: 0, fica: 0, net: 0 }
  );

  const handleStartBatchEmail = async () => {
    setIsRunning(true);
    setProgress(0);

    const updated = [...employeeStatuses];

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const payroll = calculatePayroll(emp, payPeriod, company.sutaRate);

      // Mark sending
      updated[i] = { ...updated[i], status: 'sending' };
      setEmployeeStatuses([...updated]);

      try {
        const record = await simulateEmailDelivery(emp, company, payroll, 800);
        onRecordDispatch(record);

        updated[i] = {
          ...updated[i],
          status: 'completed',
          trackingNumber: record.trackingNumber,
        };
      } catch (err) {
        console.error(err);
        updated[i] = { ...updated[i], status: 'failed' };
      }

      setProgress(Math.round(((i + 1) / employees.length) * 100));
      setEmployeeStatuses([...updated]);
    }

    setIsRunning(false);
  };

  const completedCount = employeeStatuses.filter((s) => s.status === 'completed').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full overflow-hidden border border-neutral-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-sm">
                Batch Paystub Email Dispatcher
              </h3>
              <p className="text-[11px] text-neutral-500">
                Period {payPeriod.periodNumber} ({payPeriod.startDate} to {payPeriod.endDate}) · {employees.length} Employees
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-xs space-y-4">
          
          {/* Payroll Run Financial Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-center">
            <div>
              <span className="text-[10px] text-neutral-500 block uppercase font-medium">Total Gross</span>
              <span className="font-mono font-bold text-neutral-900 text-sm">{formatCurrency(totals.gross)}</span>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-200 rounded p-1">
              <span className="text-[10px] text-emerald-800 block uppercase font-medium">Utah SIT (4.55%)</span>
              <span className="font-mono font-bold text-emerald-900 text-sm">{formatCurrency(totals.utahTax)}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 block uppercase font-medium">Federal & FICA</span>
              <span className="font-mono font-bold text-neutral-900 text-sm">{formatCurrency(totals.federalTax + totals.fica)}</span>
            </div>
            <div className="bg-neutral-900 text-white rounded p-1">
              <span className="text-[10px] text-neutral-300 block uppercase font-medium">Net Disbursed</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{formatCurrency(totals.net)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          {isRunning && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-medium text-neutral-700">
                <span>Dispatching paystubs...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Employee Queue List */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="bg-neutral-100 px-3 py-2 border-b border-neutral-200 flex justify-between items-center text-[11px] font-semibold text-neutral-700">
              <span>Employee & Recipient Email</span>
              <span>Net Pay & Status</span>
            </div>

            <div className="divide-y divide-neutral-100 max-h-60 overflow-y-auto">
              {employeeStatuses.map((item) => (
                <div key={item.employee.id} className="p-3 flex items-center justify-between hover:bg-neutral-50/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-[10px]">
                      {item.employee.firstName.charAt(0)}{item.employee.lastName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-900">
                        {item.employee.firstName} {item.employee.lastName}
                      </span>
                      <span className="text-neutral-500 ml-2 font-mono text-[11px]">
                        {item.employee.email}
                      </span>
                      <span className="block text-[10px] text-neutral-400">
                        {item.employee.title} · {item.employee.department}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-neutral-900 block text-xs">
                      {formatCurrency(item.netPay)}
                    </span>
                    {item.status === 'idle' && (
                      <span className="text-[10px] text-neutral-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" /> Ready
                      </span>
                    )}
                    {item.status === 'sending' && (
                      <span className="text-[10px] text-amber-600 font-medium animate-pulse flex items-center gap-1 justify-end">
                        <Mail className="w-3 h-3" /> Sending PDF...
                      </span>
                    )}
                    {item.status === 'completed' && (
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 justify-end">
                        <CheckCircle2 className="w-3 h-3" /> Delivered ({item.trackingNumber?.slice(-6)})
                      </span>
                    )}
                    {item.status === 'failed' && (
                      <span className="text-[10px] text-rose-600 font-medium">Failed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-3 border-t border-neutral-200 flex items-center justify-between">
            <span className="text-neutral-500 text-[11px]">
              {completedCount} of {employees.length} paystubs delivered
            </span>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={isRunning}
                className="px-3 py-1.5 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 font-medium transition-colors"
              >
                Close
              </button>

              <button
                onClick={handleStartBatchEmail}
                disabled={isRunning || completedCount === employees.length}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 text-white rounded-lg font-semibold transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {completedCount === employees.length
                    ? 'All Dispatched'
                    : isRunning
                    ? 'Dispatching...'
                    : `Email All ${employees.length} Paystubs`}
                </span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
