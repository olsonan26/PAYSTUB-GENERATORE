import React, { useState } from 'react';
import { CalculatedPayroll, Company, EmailDispatchRecord, Employee } from '../types/payroll';
import { buildPaystubEmailContent, openInGmailWeb, openInMailto, simulateEmailDelivery } from '../utils/emailService';
import { Mail, CheckCircle2, Copy, ExternalLink, Send, Paperclip, X } from 'lucide-react';
import { formatCurrency } from '../utils/taxCalculator';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  company: Company;
  payroll: CalculatedPayroll;
  onRecordDispatch: (record: EmailDispatchRecord) => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  employee,
  company,
  payroll,
  onRecordDispatch,
}) => {
  const [recipientEmail, setRecipientEmail] = useState(employee.email);
  const [isSending, setIsSending] = useState(false);
  const [sentRecord, setSentRecord] = useState<EmailDispatchRecord | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const { subject, bodyText } = buildPaystubEmailContent(
    { ...employee, email: recipientEmail },
    company,
    payroll
  );

  const handleSendAutomated = async () => {
    setIsSending(true);
    try {
      const record = await simulateEmailDelivery(
        { ...employee, email: recipientEmail },
        company,
        payroll,
        900
      );
      setSentRecord(record);
      onRecordDispatch(record);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(`SUBJECT: ${subject}\n\n${bodyText}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden border border-neutral-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-sm">
                Email Paystub Statement
              </h3>
              <p className="text-[11px] text-neutral-500">
                Direct automated dispatch to {employee.firstName} {employee.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 text-xs space-y-4 max-h-[75vh] overflow-y-auto">
          
          {sentRecord ? (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-950 text-sm">Paystub Email Delivered</h4>
                <p className="text-emerald-800 text-xs mt-0.5">
                  Dispatched to <strong>{sentRecord.recipientEmail}</strong>
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-emerald-200 text-left font-mono text-[11px] space-y-1 text-neutral-600">
                <div>Tracking ID: <strong>{sentRecord.trackingNumber}</strong></div>
                <div>Timestamp: <strong>{sentRecord.sentAt}</strong></div>
                <div>Net Pay Disbursed: <strong>{formatCurrency(sentRecord.netPay)}</strong></div>
                <div>PDF Attachment: <strong>Paystub_{employee.firstName}_{employee.lastName}.pdf (Verified)</strong></div>
              </div>

              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => setSentRecord(null)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  Send Another Copy
                </button>
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Recipient Field */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 font-mono text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Sender Account (From)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${company.name} <${company.email}>`}
                    className="w-full bg-neutral-100 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-600 truncate"
                  />
                </div>
              </div>

              {/* Subject Field */}
              <div>
                <label className="block font-medium text-neutral-700 mb-1">Subject</label>
                <input
                  type="text"
                  readOnly
                  value={subject}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-800 font-medium"
                />
              </div>

              {/* Attachment Pill Banner */}
              <div className="flex items-center gap-2 p-2 bg-neutral-100 rounded-lg text-neutral-700 text-[11px]">
                <Paperclip className="w-3.5 h-3.5 text-neutral-500" />
                <span>
                  Attached file: <strong>Paystub_{employee.firstName}_{employee.lastName}_Period_{payroll.payPeriodNumber}.pdf</strong>
                </span>
                <span className="ml-auto text-[10px] text-neutral-500 font-mono">Letter 8.5x11</span>
              </div>

              {/* Email Body Preview */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-medium text-neutral-700">Email Body & Statement Preview</label>
                  <button
                    onClick={handleCopyText}
                    className="text-[11px] text-neutral-600 hover:text-neutral-900 flex items-center gap-1 font-medium"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copied ? 'Copied!' : 'Copy Body'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={8}
                  value={bodyText}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 font-mono text-[11px] text-neutral-700 leading-relaxed resize-none focus:outline-none"
                />
              </div>

              {/* Dispatch Action Buttons */}
              <div className="pt-2 border-t border-neutral-200 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleSendAutomated}
                    disabled={isSending || !recipientEmail}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-400 text-white font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSending ? 'Dispatching Paystub...' : 'Send Automated Email'}</span>
                  </button>

                  <button
                    onClick={() => openInGmailWeb(employee, company, payroll)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Open in Gmail</span>
                  </button>

                  <button
                    onClick={() => openInMailto(employee, company, payroll)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 font-medium rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Mail className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Mail App</span>
                  </button>
                </div>

                <p className="text-[10px] text-neutral-400 text-center">
                  Automated dispatch sends the complete Utah payroll statement with PDF attachment to the employee's inbox.
                </p>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
