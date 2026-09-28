import { useState, useEffect } from 'react';
import { Company, EmailDispatchRecord, Employee, PayPeriodInput, PaystubTemplate } from './types/payroll';
import { DEFAULT_COMPANY, DEFAULT_EMPLOYEES, DEFAULT_PAY_PERIOD } from './utils/defaultData';
import { calculatePayroll, formatCurrency } from './utils/taxCalculator';
import { exportPaystubToPdf } from './utils/pdfGenerator';
import { Header } from './components/Header';
import { PaystubPreview } from './components/PaystubPreview';
import { EmployeeEditor } from './components/EmployeeEditor';
import { EmployeeList } from './components/EmployeeList';
import { PayPeriodBar } from './components/PayPeriodBar';
import { EmailModal } from './components/EmailModal';
import { BatchProcessingModal } from './components/BatchProcessingModal';
import { CompanySettingsModal } from './components/CompanySettingsModal';
import { UtahTaxInspector } from './components/UtahTaxInspectorModal';
import { DispatchLogView } from './components/DispatchLogView';
import { PayrollTestModal } from './components/PayrollTestModal';
import { Download, Mail, Printer, Calculator, FileCheck2, UserCheck, ShieldCheck } from 'lucide-react';

const STORAGE_KEY_COMPANY = 'paystubs_utah_company_v4';
const STORAGE_KEY_EMPLOYEES = 'paystubs_utah_employees_v4';
const STORAGE_KEY_LOGS = 'paystubs_utah_dispatch_logs_v4';

export default function App() {
  // 1. Core State with LocalStorage Persistence
  const [company, setCompany] = useState<Company>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COMPANY) || localStorage.getItem('paystubs_utah_company_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.name === 'Ancient Touch Therapy') {
          return {
            ...parsed,
            address: '1543 N Redwood Rd',
            city: 'Saratoga Springs',
            state: 'UT',
            zip: '84005',
            ein: '3095200',
            utahTaxId: '15056820-002-WTH',
          };
        }
      } catch (e) { console.error(e); }
    }
    return DEFAULT_COMPANY;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EMPLOYEES) || localStorage.getItem('paystubs_utah_employees_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some(e => e.firstName === 'Nadia')) {
          return parsed.map((e: Employee) => {
            if (e.firstName === 'Nadia') {
              return {
                ...e,
                address: '4605 E Rustic Ranch Way',
                city: 'Eagle Mountain',
                state: 'UT',
                zip: '84005-6397',
                taxStatus: 'Exempt',
              };
            }
            return e;
          });
        }
      } catch (e) { console.error(e); }
    }
    return DEFAULT_EMPLOYEES;
  });

  const [emailLogs, setEmailLogs] = useState<EmailDispatchRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LOGS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(DEFAULT_EMPLOYEES[0].id);
  const [payPeriod, setPayPeriod] = useState<PayPeriodInput>(DEFAULT_PAY_PERIOD);
  const [template, setTemplate] = useState<PaystubTemplate>('exact_adp');
  const [activeTab, setActiveTab] = useState<'generator' | 'employees' | 'utah_tax' | 'batch_queue'>('generator');

  // Modals
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COMPANY, JSON.stringify(company));
  }, [company]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(emailLogs));
  }, [emailLogs]);

  // Current Active Employee
  const currentEmployee = employees.find((e) => e.id === selectedEmployeeId) || employees[0];

  // Current Payroll Calculation
  const currentPayroll = calculatePayroll(currentEmployee, payPeriod, company.sutaRate);

  // Handlers
  const handleUpdateEmployee = (updated: Employee) => {
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleAddEmployee = () => {
    const newId = `emp_${Date.now()}`;
    const newEmployee: Employee = {
      id: newId,
      employeeNumber: `EMP-${Math.floor(1150 + Math.random() * 850)}`,
      firstName: 'New',
      lastName: 'Employee',
      ssnMasked: '•••-••-1234',
      ssnLast4: '1234',
      email: 'new.employee@example.com',
      phone: '(801) 555-0100',
      address: '100 S State St',
      city: 'Salt Lake City',
      state: 'UT',
      zip: '84111',
      department: 'Operations',
      title: 'Operations Associate',
      hireDate: new Date().toISOString().split('T')[0],
      payType: 'hourly',
      payFrequency: 'biweekly',
      hourlyRate: 30.00,
      defaultHoursPerPeriod: 80,
      annualSalary: 62400,
      federalFilingStatus: 'single',
      utahTaxMethod: 'formula',
      utahAllowances: 1,
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
        bankName: 'America First Credit Union',
        routingNumberMasked: '••••••123',
        accountNumberMasked: '••••••••9876',
        accountType: 'Checking',
      },
      deductions: [],
    };

    setEmployees((prev) => [...prev, newEmployee]);
    setSelectedEmployeeId(newId);
  };

  const handleDeleteEmployee = (id: string) => {
    if (employees.length <= 1) {
      alert('You must maintain at least one employee record.');
      return;
    }
    const remaining = employees.filter((e) => e.id !== id);
    setEmployees(remaining);
    setSelectedEmployeeId(remaining[0].id);
  };

  const handleRecordDispatch = (record: EmailDispatchRecord) => {
    setEmailLogs((prev) => [record, ...prev]);
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setExportMessage('Generating PDF...');
    const filename = `Paystub_${currentEmployee.firstName}_${currentEmployee.lastName}_Period_${payPeriod.periodNumber}.pdf`;
    try {
      const ok = await exportPaystubToPdf({
        elementId: 'paystub-document-render',
        filename,
      });
      if (ok) {
        setExportMessage('PDF Downloaded!');
        setTimeout(() => setExportMessage(''), 3500);
      } else {
        setExportMessage('Printed');
        setTimeout(() => setExportMessage(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setExportMessage('Error exporting');
      setTimeout(() => setExportMessage(''), 3000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCompanySettings={() => setIsCompanyModalOpen(true)}
        onOpenBatchEmail={() => setIsBatchModalOpen(true)}
        employeeCount={employees.length}
      />

      {/* Main App Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW 1: PAYSTUB STUDIO & GENERATOR */}
        {activeTab === 'generator' && (
          <div>
            {/* Pay Period & Template Control Bar */}
            <PayPeriodBar
              payPeriod={payPeriod}
              onChangePayPeriod={setPayPeriod}
              template={template}
              onChangeTemplate={setTemplate}
            />

            {/* Split Screen Workspace: Left Controls / Right Live Stub */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Quick Employee Switcher + Quick Adjustments (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Employee Quick Switcher */}
                <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-neutral-800">Active Employee:</span>
                  </div>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="bg-neutral-50 border border-neutral-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[200px]"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.title})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Period Pay Adjustments (e.g. Overtime & Bonus) */}
                <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs text-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                    <h4 className="font-bold text-neutral-900">Period Hours & Additions</h4>
                    <span className="text-[11px] text-neutral-500">Pay Date: {payPeriod.payDate}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-neutral-600 mb-1 font-medium">Regular Hours</label>
                      <input
                        type="number"
                        step="0.5"
                        value={payPeriod.regularHoursWorked ?? currentEmployee.defaultHoursPerPeriod}
                        onChange={(e) =>
                          setPayPeriod({
                            ...payPeriod,
                            regularHoursWorked: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 font-mono text-neutral-900 text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-600 mb-1 font-medium">Overtime (1.5x)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={payPeriod.overtimeHoursWorked || 0}
                        onChange={(e) =>
                          setPayPeriod({
                            ...payPeriod,
                            overtimeHoursWorked: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 font-mono text-neutral-900 text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-600 mb-1 font-medium">Bonus / Addl ($)</label>
                      <input
                        type="number"
                        step="50"
                        value={payPeriod.bonusAmount || 0}
                        onChange={(e) =>
                          setPayPeriod({
                            ...payPeriod,
                            bonusAmount: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-neutral-50 border border-neutral-300 rounded px-2 py-1 font-mono text-neutral-900 text-center"
                      />
                    </div>
                  </div>

                  {/* Real-Time Utah Tax Card */}
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider block">
                        Utah State Tax (4.55%)
                      </span>
                      <span className="text-xs text-neutral-600 font-medium">
                        {currentEmployee.utahTaxMethod === 'formula' ? 'TC-15 Credit Method' : 'Flat 4.55% Standard'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-sm text-emerald-900 block">
                        {formatCurrency(currentPayroll.utahStateTax)}
                      </span>
                      <button
                        onClick={() => setActiveTab('utah_tax')}
                        className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 justify-end font-medium"
                      >
                        <Calculator className="w-3 h-3" /> Inspect Math
                      </button>
                    </div>
                  </div>
                </div>

                {/* Full Employee Parameters Editor */}
                <EmployeeEditor
                  employee={currentEmployee}
                  onUpdateEmployee={handleUpdateEmployee}
                  onDeleteEmployee={handleDeleteEmployee}
                  calculatedUtahTax={currentPayroll.utahStateTax}
                />
              </div>

              {/* Right Column: Live Paystub Preview & Action Buttons (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Action Bar Above Preview */}
                <div className="no-print bg-white p-3 rounded-xl border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-neutral-900 block leading-tight">
                        Paystub Document Preview
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        {currentEmployee.firstName} {currentEmployee.lastName} · Net: {formatCurrency(currentPayroll.netPay)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsTestModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors"
                      title="Run automated deterministic tests for 09/01, 09/08, 09/15, 09/22"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Reconciliation Tests</span>
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                      title="Print or Save via Browser Print Dialog"
                    >
                      <Printer className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="hidden sm:inline">Print</span>
                    </button>

                    <button
                      onClick={handleExportPdf}
                      disabled={isExportingPdf}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                        exportMessage === 'PDF Downloaded!'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                      }`}
                      title="Download clean official PDF paystub file"
                    >
                      <Download className={`w-3.5 h-3.5 ${exportMessage === 'PDF Downloaded!' ? 'text-emerald-600' : 'text-neutral-500'}`} />
                      <span>{isExportingPdf ? 'Exporting...' : exportMessage || 'Export PDF'}</span>
                    </button>

                    <button
                      onClick={() => setIsEmailModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Paystub</span>
                    </button>
                  </div>
                </div>

                {/* Rendered Paystub Artifact */}
                <div className="print-only-container">
                  <PaystubPreview
                    company={company}
                    employee={currentEmployee}
                    payroll={currentPayroll}
                    template={template}
                    containerId="paystub-document-render"
                  />
                </div>

              </div>

            </div>
          </div>
        )}

        {/* VIEW 2: ALL EMPLOYEES DIRECTORY */}
        {activeTab === 'employees' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[80vh]">
            <div className="md:col-span-4 h-full">
              <EmployeeList
                employees={employees}
                selectedEmployeeId={selectedEmployeeId}
                onSelectEmployee={setSelectedEmployeeId}
                onAddEmployee={handleAddEmployee}
                payPeriod={payPeriod}
                company={company}
              />
            </div>

            <div className="md:col-span-8 overflow-y-auto">
              <EmployeeEditor
                employee={currentEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                calculatedUtahTax={currentPayroll.utahStateTax}
              />
            </div>
          </div>
        )}

        {/* VIEW 3: UTAH STATE TAX INSPECTOR & FORMULA BREAKDOWN */}
        {activeTab === 'utah_tax' && (
          <UtahTaxInspector />
        )}

        {/* VIEW 4: EMAIL DISPATCH LOG & AUDIT QUEUE */}
        {activeTab === 'batch_queue' && (
          <DispatchLogView
            logs={emailLogs}
            onClearLogs={() => setEmailLogs([])}
            onOpenBatchEmail={() => setIsBatchModalOpen(true)}
          />
        )}

      </main>

      {/* MODALS */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        employee={currentEmployee}
        company={company}
        payroll={currentPayroll}
        onRecordDispatch={handleRecordDispatch}
      />

      <BatchProcessingModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        employees={employees}
        company={company}
        payPeriod={payPeriod}
        onRecordDispatch={handleRecordDispatch}
      />

      <CompanySettingsModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        company={company}
        onSaveCompany={setCompany}
      />

      <PayrollTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />

    </div>
  );
}
