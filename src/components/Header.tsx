import React from 'react';
import { Building2, Calculator, FileText, Mail, Users, Send } from 'lucide-react';

interface HeaderProps {
  activeTab: 'generator' | 'employees' | 'utah_tax' | 'batch_queue';
  setActiveTab: (tab: 'generator' | 'employees' | 'utah_tax' | 'batch_queue') => void;
  onOpenCompanySettings: () => void;
  onOpenBatchEmail: () => void;
  employeeCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenCompanySettings,
  onOpenBatchEmail,
  employeeCount,
}) => {
  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Zone 1: Single Brand Wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('generator')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm font-bold text-sm tracking-tight transition-transform group-hover:scale-105">
                P
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-neutral-900 group-hover:text-emerald-700 transition-colors">
                  Paystubs.app
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Utah Edition · 4.55%
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links / Segmented Views */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
            <button
              onClick={() => setActiveTab('generator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeTab === 'generator'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paystub Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeTab === 'employees'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Employees ({employeeCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('utah_tax')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeTab === 'utah_tax'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Utah Tax Guide</span>
            </button>

            <button
              onClick={() => setActiveTab('batch_queue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeTab === 'batch_queue'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Dispatch Log</span>
            </button>
          </nav>

          {/* Zone 3: 1-2 Primary Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenCompanySettings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 hover:border-neutral-400 transition-colors whitespace-nowrap"
              title="Company EIN, Utah State Tax ID & Branding"
            >
              <Building2 className="w-3.5 h-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Company Settings</span>
              <span className="sm:hidden">Company</span>
            </button>

            <button
              onClick={onOpenBatchEmail}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Batch Email Stubs</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
