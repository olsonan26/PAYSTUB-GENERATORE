import React from 'react';
import { PayPeriodInput, PaystubTemplate } from '../types/payroll';
import { getPayPeriodDetailsForTuesday } from '../utils/datePayrollLogic';
import { Calendar, Layout, Hash, Check } from 'lucide-react';

interface PayPeriodBarProps {
  payPeriod: PayPeriodInput;
  onChangePayPeriod: (updated: PayPeriodInput) => void;
  template: PaystubTemplate;
  onChangeTemplate: (template: PaystubTemplate) => void;
}

export const PayPeriodBar: React.FC<PayPeriodBarProps> = ({
  payPeriod,
  onChangePayPeriod,
  template,
  onChangeTemplate,
}) => {
  const handlePayDateChange = (newDate: string) => {
    if (!newDate) return;
    const details = getPayPeriodDetailsForTuesday(newDate);
    onChangePayPeriod({
      ...payPeriod,
      payDate: details.payDate,
      startDate: details.startDate,
      endDate: details.endDate,
      periodNumber: details.periodNumber,
      checkNumber: details.checkNumber,
      adviceNumber: details.checkNumber,
    });
  };

  const updateField = <K extends keyof PayPeriodInput>(key: K, value: PayPeriodInput[K]) => {
    onChangePayPeriod({
      ...payPeriod,
      [key]: value,
    });
  };

  const testPayDates = ['2026-09-01', '2026-09-08', '2026-09-15', '2026-09-22'];

  return (
    <div className="no-print bg-white border border-neutral-200 rounded-xl p-4 shadow-xs mb-6 text-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Pay Date & Automated Weekly Period Logic */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-neutral-500 font-semibold uppercase text-[10px] tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tuesday Payday:</span>
          </div>

          {/* Primary Date Picker */}
          <div className="flex items-center gap-1.5">
            <label className="text-neutral-700 font-bold">Pay Date</label>
            <input
              type="date"
              value={payPeriod.payDate}
              onChange={(e) => handlePayDateChange(e.target.value)}
              className="bg-emerald-50 border border-emerald-300 rounded-lg px-2.5 py-1.5 font-mono text-emerald-950 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs cursor-pointer"
              title="Select Tuesday payday (automatically sets preceding Monday-Sunday pay period)"
            />
          </div>

          {/* Quick Date Presets */}
          <div className="hidden sm:flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg text-[11px]">
            {testPayDates.map((dt) => {
              const isSelected = payPeriod.payDate === dt;
              return (
                <button
                  key={dt}
                  onClick={() => handlePayDateChange(dt)}
                  className={`px-2 py-0.5 rounded-md font-mono transition-colors ${
                    isSelected
                      ? 'bg-white text-emerald-800 font-bold shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {dt.slice(5)}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 text-neutral-500">
            <span>Period:</span>
            <span className="font-mono text-neutral-800 font-semibold bg-neutral-100 px-2 py-0.5 rounded">
              {payPeriod.startDate} to {payPeriod.endDate}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-neutral-500">Period #</label>
            <span className="font-mono text-neutral-800 font-semibold">
              {payPeriod.periodNumber} of 52
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-neutral-400" />
            <label className="text-neutral-500">Advice #</label>
            <input
              type="text"
              value={payPeriod.checkNumber}
              onChange={(e) => updateField('checkNumber', e.target.value)}
              className="w-24 bg-neutral-50 border border-neutral-300 rounded px-2 py-1 font-mono text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
            />
          </div>
        </div>

        {/* Template Switcher */}
        <div className="flex items-center gap-2 border-t lg:border-t-0 pt-2 lg:pt-0">
          <span className="text-neutral-500 font-medium flex items-center gap-1">
            <Layout className="w-3.5 h-3.5" />
            <span>Format:</span>
          </span>
          <div className="inline-flex p-0.5 bg-neutral-100 rounded-lg">
            <button
              onClick={() => onChangeTemplate('exact_adp')}
              className={`px-2.5 py-1 font-semibold rounded-md transition-all ${
                template === 'exact_adp'
                  ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              title="Identical layout to your uploaded paycheck"
            >
              Exact Match (Uploaded)
            </button>
            <button
              onClick={() => onChangeTemplate('classic')}
              className={`px-2.5 py-1 font-medium rounded-md transition-all ${
                template === 'classic'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Classic
            </button>
            <button
              onClick={() => onChangeTemplate('modern')}
              className={`px-2.5 py-1 font-medium rounded-md transition-all ${
                template === 'modern'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Modern
            </button>
            <button
              onClick={() => onChangeTemplate('check_stub')}
              className={`px-2.5 py-1 font-medium rounded-md transition-all ${
                template === 'check_stub'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Check Stub
            </button>
            <button
              onClick={() => onChangeTemplate('executive')}
              className={`px-2.5 py-1 font-medium rounded-md transition-all ${
                template === 'executive'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Executive
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
