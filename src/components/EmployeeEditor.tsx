import React, { useState } from 'react';
import { DeductionItem, Employee, FederalFilingStatus, PayFrequency, PayType, UtahTaxMethod } from '../types/payroll';
import { Plus, Trash2, ShieldCheck, DollarSign, Clock, CreditCard, Building } from 'lucide-react';
import { formatCurrency } from '../utils/taxCalculator';

interface EmployeeEditorProps {
  employee: Employee;
  onUpdateEmployee: (updated: Employee) => void;
  onDeleteEmployee?: (id: string) => void;
  calculatedUtahTax: number;
}

export const EmployeeEditor: React.FC<EmployeeEditorProps> = ({
  employee,
  onUpdateEmployee,
  onDeleteEmployee,
  calculatedUtahTax,
}) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'compensation' | 'taxes' | 'deductions' | 'bank'>('compensation');

  const updateField = <K extends keyof Employee>(key: K, value: Employee[K]) => {
    onUpdateEmployee({
      ...employee,
      [key]: value,
    });
  };

  const handleAddDeduction = () => {
    const newDeduction: DeductionItem = {
      id: `ded_${Date.now()}`,
      name: '401(k) Contribution',
      amount: 100,
      isPreTax: true,
      type: '401k',
    };
    onUpdateEmployee({
      ...employee,
      deductions: [...employee.deductions, newDeduction],
    });
  };

  const handleUpdateDeduction = (id: string, updates: Partial<DeductionItem>) => {
    const updated = employee.deductions.map(d => d.id === id ? { ...d, ...updates } : d);
    onUpdateEmployee({ ...employee, deductions: updated });
  };

  const handleRemoveDeduction = (id: string) => {
    const updated = employee.deductions.filter(d => d.id !== id);
    onUpdateEmployee({ ...employee, deductions: updated });
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
      {/* Employee Quick Banner */}
      <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 leading-tight">
              {employee.firstName} {employee.lastName}
            </h3>
            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
              <span>{employee.title}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{employee.employeeNumber}</span>
              <span aria-hidden="true">·</span>
              <span>{employee.department}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Est. Utah State Tax</span>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {formatCurrency(calculatedUtahTax)} / period
            </span>
          </div>
        </div>
      </div>

      {/* Segmented Control Navigation */}
      <div className="flex border-b border-neutral-200 bg-white overflow-x-auto text-xs p-1 gap-1">
        <button
          onClick={() => setActiveSection('compensation')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors ${
            activeSection === 'compensation'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Pay & Hours</span>
        </button>

        <button
          onClick={() => setActiveSection('taxes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors ${
            activeSection === 'taxes'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Utah & Federal Taxes</span>
        </button>

        <button
          onClick={() => setActiveSection('deductions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors ${
            activeSection === 'deductions'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Deductions ({employee.deductions.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('profile')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors ${
            activeSection === 'profile'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Profile & Recipient Email</span>
        </button>

        <button
          onClick={() => setActiveSection('bank')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md whitespace-nowrap transition-colors ${
            activeSection === 'bank'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Direct Deposit & PTO</span>
        </button>
      </div>

      <div className="p-5 text-xs">
        {/* COMPENSATION SECTION */}
        {activeSection === 'compensation' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">Pay Type</label>
                <select
                  value={employee.payType}
                  onChange={(e) => updateField('payType', e.target.value as PayType)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="salary">Salary (Exempt)</option>
                  <option value="hourly">Hourly (Non-Exempt)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Pay Frequency</label>
                <select
                  value={employee.payFrequency}
                  onChange={(e) => updateField('payFrequency', e.target.value as PayFrequency)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="biweekly">Bi-Weekly (26 periods/yr)</option>
                  <option value="semimonthly">Semi-Monthly (24 periods/yr)</option>
                  <option value="weekly">Weekly (52 periods/yr)</option>
                  <option value="monthly">Monthly (12 periods/yr)</option>
                </select>
              </div>

              {employee.payType === 'salary' ? (
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Annual Salary ($)</label>
                  <input
                    type="number"
                    step="500"
                    value={employee.annualSalary}
                    onChange={(e) => updateField('annualSalary', parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Hourly Rate ($/hr)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={employee.hourlyRate}
                    onChange={(e) => updateField('hourlyRate', parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-200">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Default Standard Hours Per Period
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={employee.defaultHoursPerPeriod}
                  onChange={(e) => updateField('defaultHoursPerPeriod', parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-neutral-400 mt-0.5 block">
                  Typically 80 hours for biweekly full-time, 40 for weekly
                </span>
              </div>

              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <span className="text-[10px] font-bold uppercase text-neutral-500 block">Current Period Pay Preview</span>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-neutral-600">Calculated Base Gross:</span>
                  <span className="font-mono font-bold text-neutral-900 text-sm">
                    {formatCurrency(
                      employee.payType === 'hourly'
                        ? employee.hourlyRate * employee.defaultHoursPerPeriod
                        : employee.annualSalary / (employee.payFrequency === 'biweekly' ? 26 : employee.payFrequency === 'semimonthly' ? 24 : employee.payFrequency === 'weekly' ? 52 : 12)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UTAH & FEDERAL TAXES SECTION */}
        {activeSection === 'taxes' && (
          <div className="space-y-5">
            {/* Utah State Specific Panel */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wide">
                    Utah State Income Tax Parameters
                  </h4>
                </div>
                <span className="text-[10px] text-emerald-800 font-medium bg-emerald-100/80 px-2 py-0.5 rounded">
                  Utah Code § 59-10-104
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Utah Withholding Method</label>
                  <select
                    value={employee.utahTaxMethod}
                    onChange={(e) => updateField('utahTaxMethod', e.target.value as UtahTaxMethod)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="formula">Utah TC-15 Formula (Recommended)</option>
                    <option value="flat_455">Flat 4.55% (HB 54 Standard)</option>
                    <option value="flat_465">Flat 4.65% (Prior Statutory Rate)</option>
                    <option value="exempt">Exempt (Form TC-W)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Utah Allowances (TC-15)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={employee.utahAllowances}
                    onChange={(e) => updateField('utahAllowances', parseInt(e.target.value) || 0)}
                    disabled={employee.utahTaxMethod !== 'formula'}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-neutral-100 disabled:text-neutral-400"
                  />
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    Personal + dependent credits (Form TC-W)
                  </span>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Additional Utah Withholding ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={employee.additionalUtahWithholding}
                    onChange={(e) => updateField('additionalUtahWithholding', parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    Optional voluntary extra state withholding
                  </span>
                </div>
              </div>
            </div>

            {/* Federal W-4 Panel */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
              <h4 className="font-bold text-neutral-800 text-xs uppercase tracking-wide mb-3">
                Federal W-4 Withholding
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Withholding Status on Stub</label>
                  <select
                    value={employee.taxStatus || 'Exempt'}
                    onChange={(e) => updateField('taxStatus', e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 font-semibold focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  >
                    <option value="Exempt">Exempt</option>
                    <option value="Married">Married</option>
                    <option value="Single">Single</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Filing Status (Table)</label>
                  <select
                    value={employee.federalFilingStatus}
                    onChange={(e) => updateField('federalFilingStatus', e.target.value as FederalFilingStatus)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  >
                    <option value="single">Single / Married Filing Separately</option>
                    <option value="married_filing_jointly">Married Filing Jointly</option>
                    <option value="head_of_household">Head of Household</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Step 3: Dependent Credits ($/yr)
                  </label>
                  <input
                    type="number"
                    step="500"
                    value={employee.w4Step3DependentsAmount}
                    onChange={(e) => updateField('w4Step3DependentsAmount', parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    e.g. $2,000 per child under age 17
                  </span>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 mb-1">
                    Step 4(c): Extra Withholding ($)
                  </label>
                  <input
                    type="number"
                    step="5"
                    value={employee.additionalFederalWithholding}
                    onChange={(e) => updateField('additionalFederalWithholding', parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    Extra FIT per pay period
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-neutral-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={employee.w4Step2Check}
                    onChange={(e) => updateField('w4Step2Check', e.target.checked)}
                    className="rounded text-neutral-900 focus:ring-neutral-900"
                  />
                  <span className="text-neutral-700">
                    Step 2(c): Multiple Jobs or Spouse Works (adjusts bracket for dual-income households)
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* DEDUCTIONS SECTION */}
        {activeSection === 'deductions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-neutral-900 text-xs">Payroll Deductions & Benefits</h4>
                <p className="text-[11px] text-neutral-500">
                  Pre-tax deductions reduce Federal and Utah State taxable income.
                </p>
              </div>
              <button
                onClick={handleAddDeduction}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Deduction</span>
              </button>
            </div>

            <div className="space-y-2">
              {employee.deductions.map((d) => (
                <div key={d.id} className="flex items-center gap-2 p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <input
                    type="text"
                    value={d.name}
                    onChange={(e) => handleUpdateDeduction(d.id, { name: e.target.value })}
                    className="flex-1 bg-white border border-neutral-300 rounded px-2 py-1 text-xs text-neutral-800"
                    placeholder="Deduction Name"
                  />

                  <div className="w-24">
                    <input
                      type="number"
                      step="5"
                      value={d.amount}
                      onChange={(e) => handleUpdateDeduction(d.id, { amount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-neutral-300 rounded px-2 py-1 text-xs font-mono text-right text-neutral-800"
                      placeholder="Amount"
                    />
                  </div>

                  <select
                    value={d.isPreTax ? 'pre' : 'post'}
                    onChange={(e) => handleUpdateDeduction(d.id, { isPreTax: e.target.value === 'pre' })}
                    className="bg-white border border-neutral-300 rounded px-2 py-1 text-xs text-neutral-800"
                  >
                    <option value="pre">Pre-Tax (Utah & Fed exempt)</option>
                    <option value="post">Post-Tax</option>
                  </select>

                  <button
                    onClick={() => handleRemoveDeduction(d.id)}
                    className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                    title="Remove Deduction"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {employee.deductions.length === 0 && (
                <div className="text-center py-6 border border-dashed border-neutral-200 rounded-lg text-neutral-400">
                  No recurring deductions configured. Click "Add Deduction" to create 401(k), health insurance, or HSA.
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROFILE & RECIPIENT EMAIL SECTION */}
        {activeSection === 'profile' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-neutral-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={employee.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={employee.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">
                  Recipient Email (For automated PDF email delivery)
                </label>
                <input
                  type="email"
                  value={employee.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={employee.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Employee ID Number</label>
                <input
                  type="text"
                  value={employee.employeeNumber}
                  onChange={(e) => updateField('employeeNumber', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Social Security Number (SSN Display)</label>
                <input
                  type="text"
                  value={employee.ssnMasked}
                  onChange={(e) => updateField('ssnMasked', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Job Title</label>
                <input
                  type="text"
                  value={employee.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">Department</label>
                <input
                  type="text"
                  value={employee.department}
                  onChange={(e) => updateField('department', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-neutral-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={employee.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 mb-1">City</label>
                <input
                  type="text"
                  value={employee.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">State</label>
                  <input
                    type="text"
                    value={employee.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">ZIP</label>
                  <input
                    type="text"
                    value={employee.zip}
                    onChange={(e) => updateField('zip', e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BANK & PTO SECTION */}
        {activeSection === 'bank' && (
          <div className="space-y-4">
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
              <h4 className="font-bold text-neutral-800 text-xs uppercase tracking-wide mb-3">
                Direct Deposit Disbursement
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Depository Bank Name</label>
                  <input
                    type="text"
                    value={employee.directDeposit.bankName}
                    onChange={(e) => updateField('directDeposit', { ...employee.directDeposit, bankName: e.target.value })}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Account Type</label>
                  <select
                    value={employee.directDeposit.accountType}
                    onChange={(e) => updateField('directDeposit', { ...employee.directDeposit, accountType: e.target.value as 'Checking' | 'Savings' })}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800"
                  >
                    <option value="Checking">Checking Account</option>
                    <option value="Savings">Savings Account</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Routing Number (Masked)</label>
                  <input
                    type="text"
                    value={employee.directDeposit.routingNumberMasked}
                    onChange={(e) => updateField('directDeposit', { ...employee.directDeposit, routingNumberMasked: e.target.value })}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 mb-1">Account Number (Masked)</label>
                  <input
                    type="text"
                    value={employee.directDeposit.accountNumberMasked}
                    onChange={(e) => updateField('directDeposit', { ...employee.directDeposit, accountNumberMasked: e.target.value })}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-800"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
              <h4 className="font-bold text-neutral-800 text-xs uppercase tracking-wide mb-3">
                Paid Time Off & Sick Leave (Hours)
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">PTO Accrued</label>
                  <input
                    type="number"
                    value={employee.ptoHoursAccrued}
                    onChange={(e) => updateField('ptoHoursAccrued', parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">PTO Used</label>
                  <input
                    type="number"
                    value={employee.ptoHoursUsed}
                    onChange={(e) => {
                      const used = parseFloat(e.target.value) || 0;
                      updateField('ptoHoursUsed', used);
                      updateField('ptoHoursRemaining', Math.max(0, employee.ptoHoursAccrued - used));
                    }}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 mb-1">PTO Remaining</label>
                  <input
                    type="number"
                    value={employee.ptoHoursRemaining}
                    onChange={(e) => updateField('ptoHoursRemaining', parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-800"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {onDeleteEmployee && (
        <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-200 flex justify-end">
          <button
            onClick={() => onDeleteEmployee(employee.id)}
            className="text-xs text-rose-600 hover:text-rose-800 font-medium transition-colors"
          >
            Delete Employee Record
          </button>
        </div>
      )}
    </div>
  );
};
