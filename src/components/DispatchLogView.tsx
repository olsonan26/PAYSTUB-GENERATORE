import React from 'react';
import { EmailDispatchRecord } from '../types/payroll';
import { formatCurrency } from '../utils/taxCalculator';
import { Mail, CheckCircle2, Trash2 } from 'lucide-react';

interface DispatchLogViewProps {
  logs: EmailDispatchRecord[];
  onClearLogs: () => void;
  onOpenBatchEmail: () => void;
}

export const DispatchLogView: React.FC<DispatchLogViewProps> = ({
  logs,
  onClearLogs,
  onOpenBatchEmail,
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-neutral-200">
        <div>
          <h2 className="text-base font-bold text-neutral-900">Email Delivery & Dispatch Log</h2>
          <p className="text-xs text-neutral-500">
            Real-time audit trail of paystub PDF statements emailed to Utah employees
          </p>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}

          <button
            onClick={onOpenBatchEmail}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Launch Batch Dispatch</span>
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-neutral-300 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-neutral-800 text-sm">No Emails Dispatched Yet</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
            When you email paystubs individually or using the Batch Dispatcher, the delivery status and PDF audit records will be logged here.
          </p>
          <button
            onClick={onOpenBatchEmail}
            className="mt-4 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Send First Batch
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 text-left font-semibold">Recipient</th>
                  <th className="py-2.5 px-4 text-left font-semibold">Email</th>
                  <th className="py-2.5 px-4 text-left font-semibold">Pay Period</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Net Pay</th>
                  <th className="py-2.5 px-4 text-left font-semibold">Tracking ID</th>
                  <th className="py-2.5 px-4 text-left font-semibold">Delivered At</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-neutral-900 whitespace-nowrap">
                      {log.employeeName}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-neutral-600 whitespace-nowrap">
                      {log.recipientEmail}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-600 whitespace-nowrap">
                      {log.payPeriod}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-neutral-900 whitespace-nowrap">
                      {formatCurrency(log.netPay)}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[10px] text-neutral-500 whitespace-nowrap">
                      {log.trackingNumber}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-500 whitespace-nowrap">
                      {log.sentAt}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Delivered
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
