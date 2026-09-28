import React, { useState } from 'react';
import { Company, Employee, PayPeriodInput } from '../types/payroll';
import { calculatePayroll, formatCurrency } from '../utils/taxCalculator';
import { Plus, Search, UserPlus } from 'lucide-react';

interface EmployeeListProps {
  employees: Employee[];
  selectedEmployeeId: string;
  onSelectEmployee: (id: string) => void;
  onAddEmployee: () => void;
  payPeriod: PayPeriodInput;
  company: Company;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  selectedEmployeeId,
  onSelectEmployee,
  onAddEmployee,
  payPeriod,
  company,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = employees.filter((emp) =>
    `${emp.firstName} ${emp.lastName} ${emp.title} ${emp.department} ${emp.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Search & Add Header */}
      <div className="p-3 border-b border-neutral-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-neutral-800 text-xs uppercase tracking-wider">
            Employees ({employees.length})
          </span>
          <button
            onClick={onAddEmployee}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search employee, dept, title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Employee List Items */}
      <div className="divide-y divide-neutral-100 overflow-y-auto flex-1">
        {filtered.map((emp) => {
          const isSelected = emp.id === selectedEmployeeId;
          const payroll = calculatePayroll(emp, payPeriod, company.sutaRate);

          return (
            <button
              key={emp.id}
              onClick={() => onSelectEmployee(emp.id)}
              className={`w-full text-left p-3 transition-colors flex items-center justify-between ${
                isSelected
                  ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600'
                  : 'hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                </div>
                <div className="min-w-0 truncate">
                  <h4 className="font-semibold text-neutral-900 text-xs truncate">
                    {emp.firstName} {emp.lastName}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 truncate">
                    <span>{emp.title}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{emp.payType}</span>
                  </div>
                  <div className="text-[10px] text-emerald-800 font-medium">
                    Utah: {emp.utahTaxMethod === 'formula' ? 'TC-15 Credit' : '4.55% Flat'}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 pl-2">
                <span className="font-mono font-bold text-xs text-neutral-900 block">
                  {formatCurrency(payroll.netPay)}
                </span>
                <span className="text-[10px] text-neutral-400 block">Net / period</span>
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-6 text-center text-xs text-neutral-400">
            No employees matching "{searchTerm}"
          </div>
        )}
      </div>

      <div className="p-3 bg-neutral-50 border-t border-neutral-200 text-center">
        <button
          onClick={onAddEmployee}
          className="text-xs text-neutral-600 hover:text-neutral-900 flex items-center justify-center gap-1 mx-auto font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Employee</span>
        </button>
      </div>
    </div>
  );
};
